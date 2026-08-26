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
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.brain import GeminiBrain
from agent.config import CFG
from agent.memory import MemoryVault
from agent.mouth import Mouth
from agent.vlog import log

app = FastAPI(title="Agapitos Kalafatas AI Agent Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared state
brain: GeminiBrain | None = None
memory: MemoryVault | None = None
mouth: Mouth | None = None


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
    await websocket.accept()
    log("[server] client connected")

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            msg_type = payload.get("type", "")

            if msg_type == "text_message":
                # Text-based interaction (from chat widget)
                text = payload.get("text", "")
                history = payload.get("history", [])

                if not text.strip():
                    continue

                # Update brain context from history
                if history and brain:
                    brain._history = []
                    for msg in history[-10:]:
                        role = "user" if msg.get("role") == "user" else "model"
                        brain._history.append({
                            "role": role,
                            "parts": [{"text": msg.get("content", "")}]
                        })
                    brain._chat = brain._client.start_chat(history=brain._history)

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
