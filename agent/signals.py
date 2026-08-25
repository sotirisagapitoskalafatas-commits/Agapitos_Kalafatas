"""Signal bus — state files that the visualizer reads.

The agent writes small state files; anything watching them (visualizer,
barehands) reacts in real time. This is the same contract backtalk uses.
"""
import json
import os
import time
from pathlib import Path

from agent.config import CFG
from agent.vlog import log

_SIGNALS_DIR = Path(CFG["signals_dir"])
_SIGNALS_DIR.mkdir(parents=True, exist_ok=True)

_state_file = _SIGNALS_DIR / ".agent_state"
_waveform_file = _SIGNALS_DIR / ".agent_waveform"
_loading_file = _SIGNALS_DIR / ".agent_loading_pid"

_current_state = "idle"
_static_active = False


def set_state(state: str):
    """Set agent state: idle, listening, thinking, speaking."""
    global _current_state
    _current_state = state
    try:
        data = {
            "state": state,
            "timestamp": time.time(),
        }
        _state_file.write_text(json.dumps(data))
    except OSError:
        pass


def static_start():
    """Start static/processing animation."""
    global _static_active
    _static_active = True
    try:
        data = {"static": True, "timestamp": time.time()}
        _waveform_file.write_text(json.dumps(data))
    except OSError:
        pass


def static_stop():
    """Stop static/processing animation."""
    global _static_active
    _static_active = False
    try:
        data = {"static": False, "timestamp": time.time()}
        _waveform_file.write_text(json.dumps(data))
    except OSError:
        pass


def get_state() -> str:
    """Get current agent state."""
    return _current_state
