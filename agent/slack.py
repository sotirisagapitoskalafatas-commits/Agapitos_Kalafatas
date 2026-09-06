"""Slack conversational bot — Events API listener + threaded reply.

Slack demands an HTTP 200 within 3 seconds, so this endpoint only VERIFIES and
ACKs. All AI + CRM work happens in a background thread (FastAPI BackgroundTasks)
which then posts the reply inside the same thread the user wrote in.

Deploy this on the long-running FastAPI service (the `agent` container in
docker-compose, or Render/Railway/DigitalOcean). Vercel Hobby's 10s serverless
cap and process-freeze-after-response make it a poor fit for the AI round-trip,
which is why this listener lives in the Python backend.
"""
import hashlib
import hmac
import os
import time

import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from agent.vlog import log

router = APIRouter()

SLACK_API = "https://slack.com/api"
BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "")
SIGNING_SECRET = os.environ.get("SLACK_SIGNING_SECRET", "")
ALLOWED_CHANNELS = {
    c.strip()
    for c in os.environ.get("SLACK_ALLOWED_CHANNELS", "").split(",")
    if c.strip()
}
CLOCK_TOLERANCE = 300  # seconds
IGNORE_SUBTYPES = {"bot_message", "message_changed", "message_deleted", "message_replied"}

# ---------------------------------------------------------------------------
# Slack API helpers
# ---------------------------------------------------------------------------

def _chat(method: str, **payload) -> dict:
    if not BOT_TOKEN:
        log("[slack] SLACK_BOT_TOKEN not configured — cannot reply")
        return {"ok": False, "error": "SLACK_BOT_TOKEN not configured"}
    form = {k: str(v) for k, v in payload.items()}
    try:
        res = httpx.post(
            f"{SLACK_API}/{method}",
            headers={"Authorization": f"Bearer {BOT_TOKEN}"},
            data=form,
            timeout=15,
        )
        data = res.json()
    except Exception as e:
        log(f"[slack] {method} network error: {e}")
        return {"ok": False, "error": str(e)}
    if not data.get("ok"):
        log(f"[slack] {method} failed: {data.get('error')}")
    return data


# ---------------------------------------------------------------------------
# Event filtering
# ---------------------------------------------------------------------------

def should_handle(event: dict) -> bool:
    etype = event.get("type")
    if etype not in ("message", "app_mention"):
        return False
    if event.get("bot_id") or event.get("username") == "slackbot":
        return False
    if event.get("subtype") in IGNORE_SUBTYPES:
        return False
    text = (event.get("text") or "").strip()
    if not text:
        return False
    # app_mention always warrants handling — it fires only on @-mention, and
    # Slack omits channel_type on this event shape.
    if etype == "app_mention":
        return True
    channel_type = event.get("channel_type")
    if channel_type == "im":
        return True
    if channel_type in ("channel", "group"):
        # Channel/group messages only trigger when the bot is @-mentioned.
        return "<@U" in text
    return False


def _thread_ts_for(event: dict) -> str | None:
    if event.get("channel_type") == "im":
        return None  # DM: reply non-threaded
    return event.get("thread_ts") or event.get("ts")


# ---------------------------------------------------------------------------
# Background worker: AI → reply
# ---------------------------------------------------------------------------

def _process_and_reply(event: dict) -> None:
    channel = event["channel"]
    thread_ts = _thread_ts_for(event)
    text = event.get("text") or ""
    user_name = event.get("user") or ""

    ack = _chat(
        "chat.postMessage",
        channel=channel,
        text=":robot_face: *Atlas* is on it — checking the CRM…",
        thread_ts=thread_ts or "",
    )
    ack_ts = ack.get("ts") if ack.get("ok") else None

    try:
        from agent.agents import handle_slack_message
        reply = handle_slack_message(text, user_name, approval_key=(channel, thread_ts or ""))
    except Exception as e:
        log(f"[slack] background worker error: {e}")
        reply = "⚠️ Something went wrong on my side. If this keeps happening, check the agent logs."

    if ack_ts:
        _chat("chat.update", channel=channel, ts=ack_ts, text=reply, mrkdwn="true")
    else:
        _chat("chat.postMessage", channel=channel, text=reply, thread_ts=thread_ts or "")


# ---------------------------------------------------------------------------
# Signature verification (Slack signs the request body + timestamp)
# ---------------------------------------------------------------------------

def _verify_signature(body_bytes: bytes, ts: str, signature: str) -> bool:
    try:
        ts_int = int(ts)
    except ValueError:
        return False
    if abs(time.time() - ts_int) > CLOCK_TOLERANCE:
        return False
    base = f"v0:{ts}:{body_bytes.decode('utf-8')}"
    expected = "v0=" + hmac.new(
        SIGNING_SECRET.encode(), base.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/api/slack/events")
async def slack_events(request: Request, background_tasks: BackgroundTasks):
    body_bytes = await request.body()
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    # 1) URL verification (Slack pings this when you save the Request URL).
    if body.get("type") == "url_verification":
        challenge = body.get("challenge")
        log("[slack] url_verification challenge answered")
        return {"challenge": challenge or ""}

    # 2) Security: verify the request really came from Slack.
    if not SIGNING_SECRET:
        log("[slack] SLACK_SIGNING_SECRET not configured — dropping event")
        return {"ok": True}
    ts = request.headers.get("x-slack-request-timestamp")
    sig = request.headers.get("x-slack-signature")
    if not ts or not sig:
        raise HTTPException(status_code=400, detail="Missing Slack signature headers")
    if not _verify_signature(body_bytes, ts, sig):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # 3) Real events → ack instantly, process in the background.
    if body.get("type") == "event_callback":
        event = body.get("event", {})
        if not should_handle(event):
            return {"ok": True}

        channel = event.get("channel", "")
        if not ALLOWED_CHANNELS:
            log("[slack] SLACK_ALLOWED_CHANNELS is EMPTY — ignoring all messages (fail closed)")
            return {"ok": True}
        if channel not in ALLOWED_CHANNELS:
            log(f"[slack] ignoring message in unallowed channel {channel}")
            return {"ok": True}

        log(f"[slack] queued task: {event.get('text', '')[:60]}")
        background_tasks.add_task(_process_and_reply, event)

    return {"ok": True}