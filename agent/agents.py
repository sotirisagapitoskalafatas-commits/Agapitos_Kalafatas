"""Multi-agent orchestration for the Slack bot.

Python mirror of the web stack's `lib/agents/orchestrator.ts`: a lightweight
keyword router delegates each Slack message to a specialist system prompt, then
Gemini function-calling drives the CRM tools in `agent/crm.py`. The robot reads
and updates the CRM exactly like the web Agents — every WRITE is an explicit
tool call the model chose, and the reply to the human confirms what actually
happened (nothing is ever assumed).
"""
import json
import os
import time

from google import genai
from google.genai import types

from agent.crm import function_declarations, dispatch
from agent.config import CFG
from agent.vlog import log

MAX_TOOL_ROUNDS = 4

_CLIENT = None
_FALLBACK_MODELS = ("gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash")


def _api_key() -> str | None:
    """Resolve the Gemini API key from env or the local .gemini_key file."""
    key = os.environ.get(CFG["gemini"]["api_key_env"])
    if not key:
        from pathlib import Path
        key_path = Path(__file__).resolve().parent.parent / "config" / ".gemini_key"
        if key_path.exists():
            key = key_path.read_text().strip()
    return key or None


def _client_for():
    """Return a cached google-genai client (new-format AQ… keys supported)."""
    global _CLIENT
    if _CLIENT is None:
        key = _api_key()
        if not key:
            return None
        _CLIENT = genai.Client(api_key=key)
    return _CLIENT

# ---- Specialist registry (mirrors ALL_AGENTS in lib/agents/core-agents.ts) ---
SPECIALISTS = {
    "leadcrm": (
        "Lead & CRM specialist",
        "You manage Agapitos Kalafatas' CRM. You use the CRM tools to look up "
        "leads, report recent new leads, update lead status, add notes, log "
        "communications, check the pipeline, and schedule follow-ups. Confirm "
        "what you actually changed and always include who/what was updated."
    ),
    "webdev": (
        "Web & Software specialist",
        "You advise on websites, e-shops, SaaS and custom software for "
        "Agapitos Kalafatas. If the request is about a specific lead, use the "
        "CRM tools to find and reference them; otherwise answer directly."
    ),
    "energy": (
        "Energy specialist",
        "You answer about electricity, gas, PV/φωτοβολταϊκά, EV charging and "
        "energy services. If it concerns a lead, use the CRM tools."
    ),
    "insurance": (
        "Insurance specialist",
        "You answer about life, health, car and property insurance. If it "
        "concerns a lead, use the CRM tools."
    ),
    "analytics": (
        "Business intelligence specialist",
        "You answer with numbers: pipeline value, win rate, lead counts, "
        "revenue. Use lead_summary, pipeline_value and list_deals to ground "
        "your answers in real data."
    ),
    "operations": (
        "Operations specialist",
        "You manage the day-to-day: create leads, schedule events, log "
        "communications, update statuses. Execute the requested CRM tool and "
        "report the result."
    ),
    "general": (
        "General assistant",
        "You help with general questions about Agapitos Kalafatas' business, "
        "services, or everyday requests. Use CRM tools whenever real CRM data "
        "would improve the answer."
    ),
}

ROUTER_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    ("leadcrm", ("lead", "l e a d", "crm", "customer", "deal", "pipeline",
                 "invoice", "client", "πελάτ", "πωλήσ", "δυνητ", "επαφή")),
    ("webdev", ("website", "e-shop", "eshop", "web", "software", "saas",
                "app", "ai agent", "application", "site", "σάιτ",
                "ιστοσελίδ", "λογισμικ", "εφαρμογή")),
    ("energy", ("energy", "electricity", "ρέυμα", "gas", "αέριο", "pv",
                "photovoltaic", "φωτοβολταϊκ", "ev", "charging", "ενέργει",
                "ρεύμα")),
    ("insurance", ("insurance", "ασφάλ", "assurance", "life insurance",
                   "health insurance", "car insurance", "property",
                   "ασφάλισ")),
    ("analytics", ("analytics", "report", "forecast", "performance", "kpi",
                   "win rate", "pipeline value", "analytics",
                   "στατιστικ", "αναφορ", "πρόβλεψ")),
]


def route(text: str) -> str:
    t = text.lower()
    for agent_id, keywords in ROUTER_KEYWORDS:
        if any(k in t for k in keywords):
            return agent_id
    return "general"


# ---------------------------------------------------------------------------
# Gemini function-calling plumbing
# ---------------------------------------------------------------------------

def _deep_dict(value):
    if isinstance(value, dict):
        return {k: _deep_dict(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_deep_dict(v) for v in value]
    return value


def _retry_delay_seconds(exc) -> float:
    """Extract Gemini's suggested retry delay (seconds float) from a 429 error."""
    import re
    if exc is None:
        return 3.0
    m = re.search(r"retry_delay\s*\{\s*seconds:\s*([0-9.]+)", str(exc))
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
    return 3.0


def _is_retryable(exc) -> bool:
    msg = str(exc)
    return "429" in msg or getattr(exc, "code", None) == 429


_MAX_429_RETRIES = 5
_MAX_429_WAIT = 15.0


def _send_with_retry(chat, content) -> object:
    """Gemini free tier is 5 req/min — back off on 429 using its retry_delay."""
    attempt = 0
    while True:
        try:
            return chat.send_message(content)
        except Exception as exc:
            if not _is_retryable(exc) or attempt >= _MAX_429_RETRIES:
                raise
            delay = min(_retry_delay_seconds(exc), _MAX_429_WAIT)
            attempt += 1
            log(f"[agents] 429, retry {attempt}/{_MAX_429_RETRIES} in {delay:.1f}s")
            time.sleep(delay)


def _part_to_dict(payload):
    """Convert a gemini FunctionResponse payload (Mapping/mappingproxy) to a dict."""
    return _deep_dict(dict(payload) if not isinstance(payload, dict) else payload)


def _first_function_calls(response):
    """Return list of (name, args, part) for the first candidate with a call."""
    if not getattr(response, "candidates", None):
        return []
    content = response.candidates[0].content
    out = []
    for part in content.parts:
        fc = part.function_call
        if fc:
            name = getattr(fc, "name", None)
            if name:
                out.append((name, _part_to_dict(fc.args), part))
    return out


def _extract_text(response) -> str:
    if not getattr(response, "candidates", None):
        return ""
    parts = response.candidates[0].content.parts
    return "\n".join(p.text for p in parts if getattr(p, "text", "")).strip()


def _jsonable(value) -> dict:
    """Make a CRM result JSON-safe for the Gemini FunctionResponse payload."""
    try:
        return json.loads(json.dumps(value, default=str))
    except Exception:
        return {"ok": False, "error": repr(value)[:300]}


def _chat_for(specialist_id: str, system_prompt: str):
    client = _client_for()
    if client is None:
        raise RuntimeError("GEMINI_API_KEY not set (see config/.gemini_key or env)")

    model_name = os.environ.get("SLACK_AGENT_MODEL") or CFG["gemini"]["model"]
    config = types.GenerateContentConfig(
        temperature=CFG["gemini"].get("temperature", 0.7),
        max_output_tokens=1200,
        system_instruction=system_prompt,
        tools=[types.Tool(function_declarations=function_declarations())],
    )

    last_err = None
    for candidate in (model_name,) + tuple(
        m for m in _FALLBACK_MODELS if m != model_name
    ):
        try:
            return client.chats.create(model=candidate, config=config)
        except Exception as e:
            last_err = e
            log(f"[agents] model {candidate} unavailable: {e}")
    raise RuntimeError(f"No usable Gemini model: {last_err}")


def run_with_tools(chat, user_text: str) -> str:
    """Send the message and execute any CRM tool calls, looping until done."""
    try:
        response = _send_with_retry(chat, user_text)
    except Exception as e:
        log(f"[agents] gemini call failed: {e}")
        return "⚠️ I ran into an error contacting my AI brain. Please try again in a moment."

    for _ in range(MAX_TOOL_ROUNDS):
        calls = _first_function_calls(response)
        if not calls:
            text = _extract_text(response)
            return text or "Done — nothing else to add."

        function_responses = []
        for name, args, part in calls:
            try:
                result = dispatch(name, args)
            except Exception as e:
                result = {"ok": False, "error": str(e)[:300]}
            # Return the declared result type/dict, converting nested maps.
            result_clean = _jsonable(_deep_dict(result))
            function_responses.append(
                types.Part(function_response=types.FunctionResponse(
                    name=name,
                    response=result_clean,
                ))
            )

        try:
            response = _send_with_retry(
                chat, types.Content(role="function", parts=function_responses)
            )
        except Exception as e:
            log(f"[agents] function response round failed: {e}")
            return "⚠️ I hit an error while applying that action. Nothing was changed."

    text = _extract_text(response)
    return text or "I needed more steps than I'm allowed — please ask again, once at a time."


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def handle_slack_message(user_text: str, user_name: str = "") -> str:
    t0 = time.time()
    text = _strip_mention(user_text).strip()
    if not text:
        return "Hey! Ask me anything about the CRM — e.g. *“list new leads”* or *“mark Test Lead as contacted”*."

    if text.startswith("/"):
        return ("Slash commands (like /invoice-chase) live in the web CRM AI tab. "
                "Here in Slack just ask me in plain words and I'll handle it.")

    specialist_id = route(text)
    name, system = SPECIALISTS.get(specialist_id, SPECIALISTS["general"])
    log(f"[agents] route={specialist_id} user={user_name or '?'} text={text[:80]}")

    try:
        chat = _chat_for(specialist_id, system)
        reply = run_with_tools(chat, text)
    except Exception as e:
        log(f"[agents] error: {e}")
        reply = "⚠️ I hit an error. If this keeps happening, check the agent logs."

    log(f"[agents] {specialist_id} reply in {time.time() - t0:.1f}s")
    greeting = f"*{name}* — here you go:" if specialist_id != "general" else ""
    return f"{greeting}\n\n{reply}".strip()


def _strip_mention(text: str) -> str:
    import re
    # <@U123ABC> or "<@U123ABC|Name>"
    return re.sub(r"<@[A-Z0-9]+(?:\|[^>]+)?>", "", text)