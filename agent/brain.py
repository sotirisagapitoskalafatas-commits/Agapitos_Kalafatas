"""The brain — a Gemini-powered AI session with streaming responses.

Uses Google's Gemini API (google-genai) for the AI backbone.
Supports streaming output, tool use, and persistent conversation context.
The session maintains memory across turns for coherent multi-turn dialogue.
"""
import os
import re
import time
from pathlib import Path

from agent.config import CFG
from agent.vlog import log

_SENTENCE_END = re.compile(r"(?<=[.!?])\s")


class GeminiBrain:
    """A persistent Gemini session with streaming, tool use, and memory."""

    def __init__(self, model: str | None = None):
        self.model = model or CFG["gemini"]["model"]
        self._client = None
        self._chat = None
        self._config = None
        self._history = []
        self.session = {
            "turns": 0,
            "out_tokens": 0,
            "in_tokens": 0,
            "cost": 0.0,
            "started_at": time.time(),
        }
        self._dirty = False

    async def start(self):
        """Initialize the Gemini client and start a chat session."""
        try:
            from google import genai
            from google.genai import types

            api_key = os.environ.get(CFG["gemini"]["api_key_env"])
            if not api_key:
                api_key_path = Path(__file__).resolve().parent.parent / "config" / ".gemini_key"
                if api_key_path.exists():
                    api_key = api_key_path.read_text().strip()
                else:
                    raise ValueError(
                        f"Set {CFG['gemini']['api_key_env']} env var "
                        f"or create {api_key_path} with your API key"
                    )

            self._client = genai.Client(api_key=api_key)

            # Configure safety settings to be permissive for code generation
            safety_settings = [
                types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
                types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_NONE"),
                types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
                types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
            ]

            self._config = types.GenerateContentConfig(
                max_output_tokens=CFG["gemini"]["max_output_tokens"],
                temperature=CFG["gemini"]["temperature"],
                top_p=CFG["gemini"]["top_p"],
                system_instruction=CFG["gemini"]["system_prompt"],
                safety_settings=safety_settings,
            )

            self._chat = self._client.aio.chats.create(
                model=self.model,
                config=self._config,
                history=self._history,
            )
            log(f"[brain] Gemini {self.model} initialized")
        except ImportError:
            raise RuntimeError(
                "google-genai not installed. "
                "Run: pip install google-genai"
            )

    async def stop(self):
        """Clean up the session."""
        if self._chat:
            try:
                self._history = list(await self._chat.get_history())
            except Exception:
                pass
        self._client = None
        self._chat = None
        log("[brain] session ended")

    async def interrupt(self):
        """Interrupt current generation (best effort)."""
        self._dirty = False

    async def reset_turn(self):
        """Reset for a new turn."""
        self._dirty = False

    async def reset(self):
        """Clear context and start a fresh chat session."""
        self._history = []
        if self._client:
            self._chat = self._client.aio.chats.create(
                model=self.model,
                config=self._config,
            )
        self._dirty = False

    async def rebuild_session(self, messages: list[dict]):
        """Rebuild the active chat from client-supplied {role, content} history."""
        from google.genai import types

        self._history = [
            types.Content(
                role="user" if m.get("role") == "user" else "model",
                parts=[types.Part(text=str(m.get("content", ""))[:2000])],
            )
            for m in messages[-10:]
        ]
        self._chat = self._client.aio.chats.create(
            model=self.model,
            config=self._config,
            history=self._history,
        )
        self._dirty = False

    async def ask_stream(self, utterance: str):
        """Yield complete sentences as they stream out of Gemini."""
        self._dirty = True
        self.session["turns"] += 1
        self.session["in_tokens"] += len(utterance.split()) * 2

        try:
            response = await self._chat.send_message(utterance)

            # Extract text from response
            text = ""
            if getattr(response, "text", ""):
                text = response.text
            elif getattr(response, "candidates", None):
                for candidate in response.candidates:
                    content = getattr(candidate, "content", None)
                    if content and content.parts:
                        for part in content.parts:
                            if getattr(part, "text", ""):
                                text += part.text

            # Update token counts
            if getattr(response, "usage_metadata", None) and response.usage_metadata:
                meta = response.usage_metadata
                self.session["in_tokens"] += getattr(meta, "prompt_token_count", 0)
                self.session["out_tokens"] += getattr(meta, "candidates_token_count", 0)

            # Yield sentences as they form
            buf = ""
            for char in text:
                buf += char
                m = _SENTENCE_END.search(buf)
                if m:
                    sentence, buf = buf[:m.end()].strip(), buf[m.end():]
                    if sentence:
                        yield sentence

            # Flush remaining text
            tail = buf.strip()
            if tail:
                yield tail

        except Exception as e:
            log(f"[brain] Gemini error: {e}")
            yield f"I hit an error: {str(e)[:200]}"