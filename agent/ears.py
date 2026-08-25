"""Ears — speech-to-text using faster-whisper (local, free).

Holds the microphone while the key is held, records audio, and
transcribes it locally with OpenAI Whisper models. No API keys needed.
"""
import queue
import struct
import threading
import time
import wave
from pathlib import Path

from agent.config import CFG
from agent.vlog import log

# Audio config
SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK_DURATION_MS = 30  # 30ms chunks for VAD
FRAME_SIZE = int(SAMPLE_RATE * CHUNK_DURATION_MS / 1000)


def _get_whisper_model():
    """Load the faster-whisper model."""
    try:
        from faster_whisper import WhisperModel

        model_size = CFG["stt"]["model"]
        device = CFG["stt"]["device"]
        compute = CFG["stt"]["compute"]

        if device == "auto":
            try:
                import torch
                device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                device = "cpu"

        log(f"[ears] loading whisper model {model_size} on {device}")
        model = WhisperModel(model_size, device=device, compute_type=compute)
        return model
    except ImportError:
        raise RuntimeError(
            "faster-whisper not installed. Run: pip install faster-whisper"
        )


_model = None


def _ensure_model():
    global _model
    if _model is None:
        _model = _get_whisper_model()
    return _model


def record_held(is_held_fn) -> str | None:
    """Record audio while key is held, then transcribe.

    Args:
        is_held_fn: callable returning True while the PTT key is held.

    Returns:
        Transcribed text, or None if too short/empty.
    """
    try:
        import sounddevice as sd
        import numpy as np
    except ImportError:
        raise RuntimeError(
            "sounddevice not installed. Run: pip install sounddevice"
        )

    frames = []
    recording = True

    def callback(indata, frames_count, time_info, status):
        if status:
            log(f"[ears] audio status: {status}")
        frames.append(indata.copy())

    try:
        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype="int16",
            blocksize=FRAME_SIZE,
            callback=callback,
        ):
            while is_held_fn():
                time.sleep(0.01)
    except Exception as e:
        log(f"[ears] recording error: {e}")
        return None

    if not frames:
        return None

    # Check minimum duration (0.5 seconds)
    total_frames = sum(len(f) for f in frames)
    duration = total_frames / SAMPLE_RATE
    if duration < 0.5:
        log("[ears] recording too short, skipping")
        return None

    # Transcribe
    try:
        import numpy as np
        audio_data = np.concatenate(frames, axis=0).flatten()
        audio_float = audio_data.astype(np.float32) / 32768.0

        model = _ensure_model()
        segments, info = model.transcribe(
            audio_float,
            language="en",
            beam_size=5,
            vad_filter=True,
        )

        text = " ".join(segment.text.strip() for segment in segments).strip()
        if text:
            log(f"[ears] transcribed: {text[:80]}...")
        return text if text else None
    except Exception as e:
        log(f"[ears] transcription error: {e}")
        return None


def warm():
    """Pre-load the whisper model so first transcription is fast."""
    _ensure_model()
    log("[ears] whisper model warmed up")
