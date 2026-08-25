"""Configuration — config.json merged over defaults.

This agent is inspired by the fullstack-agent + backtalk stack,
reimagined with Google Gemini AI as the brain. The voice components
(ears, mouth, ptt) remain from backtalk's proven architecture.
"""
import json
import os
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CONFIG_PATH = Path(os.environ.get("AGENT_CONFIG") or (REPO / "config" / "agent.json"))

DEFAULTS = {
    "agent_name": "Atlas",
    "agent_role": "Full-Stack SaaS Architect & AI Agent",
    "greeting": "Hello Agapitos! I'm Atlas, your AI agent. How can I help you today?",
    "signoff": "Closing the voice line. I'll be here when you need me.",

    # Gemini AI configuration
    "gemini": {
        "model": "gemini-3-flash-preview",
        "api_key_env": "GEMINI_API_KEY",
        "max_output_tokens": 8192,
        "temperature": 0.7,
        "top_p": 0.95,
        "system_prompt": (
            "You are Atlas, an AI agent created by Agapitos Kalafatas. "
            "You are a helpful, knowledgeable assistant specialized in "
            "full-stack development, SaaS architecture, AI/ML, cloud computing, "
            "and digital operations. You speak clearly and concisely. "
            "You can write code, analyze files, run commands, and help with "
            "any software engineering task. When writing code, follow best "
            "practices and clean code principles."
        ),
    },

    # Voice configuration
    "voice": {
        "engine": "kokoro",  # kokoro (free/local) or elevenlabs (premium)
        "voice_id": "bm_lewis",
        "speed": 1.0,
        "elevenlabs": {
            "enabled": False,
            "voice_id": "",
            "model": "eleven_turbo_v2_5",
        },
    },

    # Speech-to-text
    "stt": {
        "model": "small.en",
        "device": "auto",
        "compute": "int8",
    },

    # Microphone: ptt (push-to-talk) or open (hands-free)
    "mic_mode": "ptt",
    "ptt_key": "home",

    # Permissions: ask (safety first) or bypassPermissions (auto-approve)
    "permission_mode": "ask",

    # Memory vault
    "memory": {
        "vault_dir": str(REPO / "agent" / "memory"),
        "auto_save": True,
    },

    # Signals for visualizer
    "signals_dir": str(REPO / "agent"),

    # Extra directories the agent can access
    "extra_dirs": [],

    # Thinking sound (played while agent processes)
    "thinking_sound": str(REPO / "agent" / "voices" / "thinking.wav"),

    # Resume last session on launch
    "resume_last_session": False,
}


def _expand(p: str) -> str:
    return os.path.expanduser(p) if p else p


def load() -> dict:
    cfg = json.loads(json.dumps(DEFAULTS))
    try:
        user = json.loads(CONFIG_PATH.read_text())
        for k, v in user.items():
            if isinstance(v, dict) and isinstance(cfg.get(k), dict):
                cfg[k].update(v)
            else:
                cfg[k] = v
    except FileNotFoundError:
        pass
    except ValueError as e:
        print(f"[config] agent.json is not valid JSON ({e}) — using defaults",
              flush=True)

    # Expand paths
    cfg["memory"]["vault_dir"] = _expand(cfg["memory"]["vault_dir"])
    cfg["signals_dir"] = _expand(cfg["signals_dir"])
    cfg["thinking_sound"] = _expand(cfg["thinking_sound"])
    cfg["extra_dirs"] = [_expand(d) for d in cfg.get("extra_dirs", [])]

    # Build quit phrases from agent name
    name = cfg["agent_name"].lower()
    cfg["quit_phrases"] = (
        f"goodbye {name}", f"good bye {name}",
        "end voice mode", f"hang up {name}", "hang up"
    )

    return cfg


CFG = load()
