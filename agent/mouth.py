"""Mouth — text-to-speech using Kokoro (local/free) or ElevenLabs (premium).

Speaks sentences through the speakers, sentence by sentence, with
audio ducking (music lowers while speaking) and a queue for natural flow.
"""
import asyncio
import os
import queue
import subprocess
import threading
import time
from pathlib import Path

from agent.config import CFG
from agent.vlog import log

_voice_cfg = CFG["voice"]
_speaking = False
_queue: queue.Queue = queue.Queue()
_worker_thread: threading.Thread | None = None
_stop_event = threading.Event()


def _get_kokoro_voice():
    """Initialize Kokoro TTS engine."""
    try:
        import kokoro
        return kokoro
    except ImportError:
        raise RuntimeError(
            "kokoro not installed. Run: pip install kokoro"
        )


def _speak_with_kokoro(text: str, voice: str, speed: float):
    """Speak text using Kokoro TTS."""
    global _speaking
    try:
        import kokoro
        import sounddevice as sd
        import soundfile as sf
        import io

        # Generate audio
        audio_data = kokoro.tts(
            text,
            voice=voice,
            speed=speed,
        )

        if audio_data is not None:
            _speaking = True
            sd.play(audio_data, samplerate=24000)
            sd.wait()
            _speaking = False
    except Exception as e:
        log(f"[mouth] Kokoro error: {e}")
        _speaking = False


def _speak_with_elevenlabs(text: str, voice_id: str, api_key: str):
    """Speak text using ElevenLabs API."""
    global _speaking
    try:
        import httpx
        import sounddevice as sd
        import soundfile as sf
        import io

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "text": text,
            "model_id": _voice_cfg["elevenlabs"]["model"],
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        }

        response = httpx.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            audio_data, sample_rate = sf.read(io.BytesIO(response.content))
            _speaking = True
            sd.play(audio_data, samplerate=sample_rate)
            sd.wait()
            _speaking = False
        else:
            log(f"[mouth] ElevenLabs error: {response.status_code}")
            _speaking = False
    except Exception as e:
        log(f"[mouth] ElevenLabs error: {e}")
        _speaking = False


def _speaker_worker():
    """Background worker that speaks queued text."""
    global _speaking, _worker_thread

    while not _stop_event.is_set():
        try:
            text, voice, speed = _queue.get(timeout=0.1)
        except queue.Empty:
            continue

        if not text:
            continue

        engine = _voice_cfg["engine"]

        if engine == "elevenlabs" and _voice_cfg["elevenlabs"]["enabled"]:
            api_key = os.environ.get("ELEVENLABS_API_KEY")
            if api_key:
                _speak_with_elevenlabs(
                    text, _voice_cfg["elevenlabs"]["voice_id"], api_key
                )
            else:
                log("[mouth] ElevenLabs enabled but no API key, falling back to Kokoro")
                _speak_with_kokoro(text, voice, speed)
        else:
            _speak_with_kokoro(text, voice, speed)

    _worker_thread = None


class Mouth:
    """Text-to-speech output device."""

    def __init__(self):
        global _worker_thread, _stop_event

        self._queue = queue.Queue()

        # Start speaker worker
        _stop_event.clear()
        if _worker_thread is None or not _worker_thread.is_alive():
            _worker_thread = threading.Thread(
                target=_speaker_worker, daemon=True
            )
            _worker_thread.start()

    def say(self, text: str):
        """Speak text immediately, queuing behind current speech."""
        if text:
            self._queue.put(
                (text, _voice_cfg["voice_id"], _voice_cfg["speed"])
            )

    def say_chunk(self, text: str, directions=None):
        """Speak a chunk, with optional stage directions."""
        if text:
            self._queue.put(
                (text, _voice_cfg["voice_id"], _voice_cfg["speed"])
            )

    @property
    def speaking(self) -> bool:
        return not self._queue.empty() or _speaking

    def shut_up(self):
        """Stop all speech immediately."""
        try:
            import sounddevice as sd
            sd.stop()
        except Exception:
            pass
        # Clear the queue
        while not self._queue.empty():
            try:
                self._queue.get_nowait()
            except queue.Empty:
                break

    def wait_done(self, timeout: float = 30):
        """Wait for all queued speech to finish."""
        start = time.time()
        while (not self._queue.empty() or _speaking) and \
              (time.time() - start) < timeout:
            time.sleep(0.1)

    def shutdown(self):
        """Clean up the speaker."""
        self.shut_up()
        _stop_event.set()


def warm():
    """Pre-load TTS models for fast first speech."""
    engine = _voice_cfg["engine"]
    if engine == "kokoro":
        try:
            _get_kokoro_voice()
            log("[mouth] Kokoro voice warmed up")
        except Exception as e:
            log(f"[mouth] Kokoro warm-up failed: {e}")
