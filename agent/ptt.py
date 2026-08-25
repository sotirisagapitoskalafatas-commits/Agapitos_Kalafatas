"""Push-to-talk listener — holds the mic open while a key is held.

Uses pynput for cross-platform global key listening. The key is
compared against the configured PTT key; all other events are discarded.
"""
import threading
import time

from agent.config import CFG
from agent.vlog import log


class PTTListener:
    """Global key listener for push-to-talk."""

    def __init__(self, key_name: str):
        self._key_name = key_name
        self._held = False
        self._press_event = threading.Event()
        self._listener = None

        self._start_listener()

    def _start_listener(self):
        """Start the global key listener."""
        try:
            from pynput import keyboard

            def on_press(key):
                try:
                    if self._matches(key):
                        self._held = True
                        self._press_event.set()
                except Exception:
                    pass

            def on_release(key):
                try:
                    if self._matches(key):
                        self._held = False
                except Exception:
                    pass

            self._listener = keyboard.Listener(
                on_press=on_press,
                on_release=on_release,
            )
            self._listener.daemon = True
            self._listener.start()
            log(f"[ptt] listening for key: {self._key_name}")
        except ImportError:
            log("[ptt] pynput not installed, keyboard input disabled")
        except Exception as e:
            log(f"[ptt] listener error: {e}")

    def _matches(self, key) -> bool:
        """Check if the key matches the configured PTT key."""
        from pynput import keyboard

        key_map = {
            "home": keyboard.Key.home,
            "end": keyboard.Key.end,
            "f13": keyboard.Key.f13,
            "f14": keyboard.Key.f14,
            "f15": keyboard.Key.f15,
            "f16": keyboard.Key.f16,
            "f17": keyboard.Key.f17,
            "f18": keyboard.Key.f18,
            "f19": keyboard.Key.f19,
            "right_alt": keyboard.Key.alt_r,
            "right_ctrl": keyboard.Key.ctrl_r,
            "right_shift": keyboard.Key.shift_r,
            "space": keyboard.Key.space,
            "tab": keyboard.Key.tab,
            "esc": keyboard.Key.esc,
        }

        target = key_map.get(self._key_name.lower())
        if target:
            return key == target

        # Single character key
        if len(self._key_name) == 1:
            return key == keyboard.KeyCode.from_char(self._key_name)

        return False

    def wait_press(self):
        """Block until the key is pressed (one press consumed)."""
        self._press_event.wait()
        self._press_event.clear()

    def is_held(self) -> bool:
        """Return True while the key is held down."""
        return self._held

    def stop(self):
        """Stop the listener."""
        if self._listener:
            self._listener.stop()
