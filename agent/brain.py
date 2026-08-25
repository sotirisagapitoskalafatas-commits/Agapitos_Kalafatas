"""The brain — a Gemini-powered AI session with streaming responses.

Uses Google's Gemini API (google-generativeai) for the AI backbone.
Supports streaming output, tool use, and persistent conversation context.
The session maintains memory across turns for coherent multi-turn dialogue.
"""
import asyncio
import json
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
        self._history = []
        self._tools = []
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
            import google.generativeai as genai

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

            genai.configure(api_key=api_key)

            generation_config = genai.types.GenerationConfig(
                max_output_tokens=CFG["gemini"]["max_output_tokens"],
                temperature=CFG["gemini"]["temperature"],
                top_p=CFG["gemini"]["top_p"],
            )

            # Configure safety settings to be permissive for code generation
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]

            self._client = genai.GenerativeModel(
                model_name=self.model,
                system_instruction=CFG["gemini"]["system_prompt"],
                generation_config=generation_config,
                safety_settings=safety_settings,
            )

            self._chat = self._client.start_chat(history=self._history)
            log(f"[brain] Gemini {self.model} initialized")
        except ImportError:
            raise RuntimeError(
                "google-generativeai not installed. "
                "Run: pip install google-generativeai"
            )

    async def stop(self):
        """Clean up the session."""
        if self._chat:
            self._history = self._chat.history
        self._client = None
        self._chat = None
        log("[brain] session ended")

    async def interrupt(self):
        """Interrupt current generation (best effort)."""
        self._dirty = False

    async def reset_turn(self):
        """Reset for a new turn."""
        self._dirty = False

    async def query(self, text: str):
        """Send a query and return the full response."""
        self._dirty = True
        self.session["turns"] += 1
        self.session["in_tokens"] += len(text.split()) * 2  # rough estimate
        return await self._client.generate_content_async(text)

    async def ask_stream(self, utterance: str):
        """Yield complete sentences as they stream out of Gemini."""
        self._dirty = True
        self.session["turns"] += 1
        self.session["in_tokens"] += len(utterance.split()) * 2

        try:
            response = await self._chat.send_message_async(utterance)

            # Extract text from response
            text = ""
            if hasattr(response, 'text') and response.text:
                text = response.text
            elif hasattr(response, 'candidates') and response.candidates:
                for candidate in response.candidates:
                    if hasattr(candidate, 'content') and candidate.content:
                        for part in candidate.content.parts:
                            if hasattr(part, 'text'):
                                text += part.text

            # Update token counts
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                meta = response.usage_metadata
                if hasattr(meta, 'total_token_count'):
                    self.session["in_tokens"] += getattr(meta, 'prompt_token_count', 0)
                    self.session["out_tokens"] += getattr(meta, 'candidates_token_count', 0)

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

    async def context_usage(self):
        """Return context window usage info."""
        return {
            "model": self.model,
            "turns": self.session["turns"],
            "tokens": self.session,
        }

    async def set_model(self, model: str):
        """Switch model (requires restart of chat)."""
        self.model = model
        if self._chat:
            self._history = self._chat.history
        await self.stop()
        await self.start()
