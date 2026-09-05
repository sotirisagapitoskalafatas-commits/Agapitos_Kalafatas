"""FastAPI WebSocket bridge for the voice agent.

Exposes the agent's ears -> brain -> mouth pipeline over WebSocket,
enabling the Next.js frontend to stream audio and receive responses
with real-time amplitude data for WebGL visualizers.
"""
import asyncio
import json
import os
import sys
import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Ensure agent package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agent.brain import GeminiBrain
from agent.config import CFG
from agent.memory import MemoryVault
from agent.mouth import Mouth
from agent.slack import router as slack_router
from agent.vlog import log

# Security: only allow expected frontend origins to connect. Never use "*".
# Production origin is the Vercel frontend; localhost covers local development.
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS",
        "https://agapitoskalafatas.vercel.app,"
        "https://agapitoskalafatas.vercel.app/,"
        "http://localhost:3000,http://localhost:8000",
    ).split(",")
    if o.strip()
]

# Guardrails against abuse / runaway connections.
MAX_WS_MESSAGE_BYTES = 64 * 1024  # 64 KB per message
MAX_TEXT_LEN = 4000               # longest allowed user text
MAX_MESSAGES_PER_MINUTE = 60      # crude per-connection rate limit

app = FastAPI(title="Agapitos Kalafatas AI Agent Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conversational Slack bot (Events API) — mounted on the same FastAPI service.
app.include_router(slack_router)

# Shared state
brain: GeminiBrain | None = None
memory: MemoryVault | None = None
mouth: Mouth | None = None


def _is_allowed_origin(websocket: WebSocket) -> bool:
    origin = websocket.headers.get("origin")
    if not origin:
        # No Origin header (non-browser client). Reject to be safe.
        return False
    return origin.rstrip("/") in {o.rstrip("/") for o in ALLOWED_ORIGINS}



@app.on_event("startup")
async def startup():
    global brain, memory, mouth
    memory = MemoryVault()
    mouth = Mouth()
    brain = GeminiBrain()

    log("[server] connecting to Gemini...")
    try:
        await asyncio.wait_for(brain.start(), 30)
        log("[server] brain connected")
        # Warmup
        async for _ in brain.ask_stream("Say ready"):
            pass
        log("[server] brain warm")
    except Exception as e:
        log(f"[server] brain connect failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    global brain
    if brain:
        await brain.stop()
    log("[server] shutdown complete")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "agent": CFG["agent_name"],
        "model": brain.model if brain else "not initialized",
    }


@app.websocket("/ws/agent")
async def agent_websocket(websocket: WebSocket):
    # Origin check: deny connections from unexpected websites so the public
    # chat relay cannot be abused as an open LLM proxy.
    if not _is_allowed_origin(websocket):
        log(f"[server] rejected connection from origin {websocket.headers.get('origin')}")
        await websocket.close(code=1008)  # policy violation
        return

    await websocket.accept()
    log("[server] client connected")

    # Per-connection rate limiting (sliding window).
    window_start = time.monotonic()
    window_count = 0

    def _throttled() -> bool:
        nonlocal window_start, window_count
        now = time.monotonic()
        if now - window_start >= 60:
            window_start = now
            window_count = 0
        window_count += 1
        return window_count > MAX_MESSAGES_PER_MINUTE

    try:
        while True:
            data = await websocket.receive_text()
            if len(data.encode("utf-8")) > MAX_WS_MESSAGE_BYTES:
                log("[server] message too large, closing")
                await websocket.close(code=1009)  # message too big
                return

            try:
                payload = json.loads(data)
            except (json.JSONDecodeError, TypeError):
                await websocket.send_json({"type": "error", "content": "Invalid JSON payload"})
                continue

            if not isinstance(payload, dict):
                await websocket.send_json({"type": "error", "content": "Invalid payload"})
                continue

            if _throttled():
                await websocket.send_json({"type": "error", "content": "Rate limit exceeded"})
                continue

            msg_type = payload.get("type")
            if not isinstance(msg_type, str):
                await websocket.send_json({"type": "error", "content": "Missing message type"})
                continue

            if msg_type == "text_message":
                # Text-based interaction (from chat widget)
                text = payload.get("text", "")
                history = payload.get("history", [])
                if not isinstance(text, str) or not text.strip():
                    continue
                if isinstance(history, list):
                    history = [h for h in history if isinstance(h, dict)][-10:]
                else:
                    history = []

                text = text[:MAX_TEXT_LEN]

                # Update brain context from history
                if history and brain:
                    await brain.rebuild_session(history)

                # Stream response
                full_reply = []
                async for sentence in brain.ask_stream(text):
                    full_reply.append(sentence)
                    await websocket.send_json({
                        "type": "agent_stream",
                        "content": sentence,
                        "amplitude": 0.6,
                        "done": False,
                    })

                # Send final done signal
                await websocket.send_json({
                    "type": "agent_stream",
                    "content": "",
                    "amplitude": 0.0,
                    "done": True,
                })

                # Save to memory
                if full_reply and CFG["memory"]["auto_save"] and memory:
                    memory.save_conversation(
                        f"User: {text}\nAgent: {' '.join(full_reply)}"
                    )

            elif msg_type == "audio_chunk":
                # Audio-based interaction (from voice PTT)
                # For now, acknowledge — full audio pipeline requires
                # faster-whisper on the server side
                await websocket.send_json({
                    "type": "agent_stream",
                    "content": "[Voice mode requires local audio processing]",
                    "amplitude": 0.3,
                    "done": True,
                })

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        log("[server] client disconnected")
    except Exception as e:
        log(f"[server] error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass


@app.get("/")
async def root():
    return {"message": "Atlas Agent WebSocket Server", "ws_url": "/ws/agent"}
