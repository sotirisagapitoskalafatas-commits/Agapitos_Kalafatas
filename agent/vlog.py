"""Logging for the agent — timestamped, readable, always flushed."""
import sys
import time
from pathlib import Path

LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
_LOG_FILE = LOG_DIR / "agent.log"


def log(msg: str):
    """Print to console and append to log file."""
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    try:
        with open(_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError:
        pass
