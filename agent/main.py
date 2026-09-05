"""Fullstack Gemini Agent — the main entry point.

Flow: hold the key and speak -> local transcription -> Gemini streams the
reply -> sentences go to the mouth the moment they complete (~1-2s to
first audio on warm turns). Typing in the terminal is also a first-class
turn: same conversation, spoken reply.
"""
import asyncio
import json
import os
import queue
import re
import sys
import threading
import time

from agent.brain import GeminiBrain
from agent.config import CFG
from agent.ears import record_held, warm as warm_ears
from agent.memory import MemoryVault
from agent.mouth import Mouth
from agent.ptt import PTTListener
from agent.signals import set_state, static_start, static_stop
from agent.vlog import log

NAME = CFG["agent_name"]
QUIT_PHRASES = CFG["quit_phrases"]
YES_PHRASES = {"yes", "yeah", "yep", "sure", "approve", "approved",
               "go ahead", "do it", "ok", "okay"}


async def speak_reply(brain: GeminiBrain, mouth: Mouth, memory: MemoryVault,
                      text: str):
    """First sentence ships alone (fast start); the rest go in 2-sentence breaths."""
    t0 = time.time()
    first = True
    batch = []
    full_reply = []

    def emit(raw: str):
        nonlocal first, batch
        s = " ".join(raw.replace("`", "").replace("#", "").split()).strip()
        if not s:
            return
        full_reply.append(s)
        if first:
            log(f"[{NAME}] ({time.time()-t0:.1f}s to first) {s}")
            mouth.say_chunk(s)
            first = False
        else:
            log(f"[{NAME}] {s}")
            batch.append(s)
            if len(batch) >= 2:
                mouth.say_chunk(" ".join(batch))
                batch = []

    try:
        async for sentence in brain.ask_stream(text):
            emit(sentence)
        if batch:
            mouth.say_chunk(" ".join(batch))
        if first:
            static_stop()
            set_state("idle")

        # Save to memory
        if full_reply and CFG["memory"]["auto_save"]:
            reply_text = " ".join(full_reply)
            memory.save_conversation(
                f"User: {text}\nAgent: {reply_text}"
            )
    except asyncio.CancelledError:
        try:
            await brain.interrupt()
        except Exception:
            pass
        raise


async def amain():
    """Main async entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Fullstack Gemini Agent")
    parser.add_argument("--open-mic", action="store_true",
                        help="Start in hands-free listening mode")
    parser.add_argument("--model", type=str, default=None,
                        help="Override Gemini model for this session")
    parser.add_argument("--chat", action="store_true",
                        help="Text-only chat mode (no voice)")
    parser.add_argument("--web", action="store_true",
                        help="Start web interface")
    args = parser.parse_args()

    # Initialize components
    memory = MemoryVault()
    mouth = Mouth()
    brain = GeminiBrain(model=args.model)

    log(f"[agent] starting — name={NAME} model={brain.model}")
    log(f"[agent] memory vault: {memory.vault_dir}")

    if not args.chat and not args.web:
        # Voice mode
        ears_module = __import__("agent.ears", fromlist=["ears"])
        ears_module.warm()
        mouth_module = __import__("agent.mouth", fromlist=["mouth"])
        mouth_module.warm()

        # Connect brain
        log("[agent] connecting to Gemini...")
        try:
            await asyncio.wait_for(brain.start(), 30)
            log("[agent] brain connected")

            # Warmup
            async for _ in brain.ask_stream("Say ready in one word"):
                pass
            log("[agent] brain warm")
        except Exception as e:
            log(f"[agent] brain connect failed: {e}")
            mouth.say("I couldn't reach the Gemini API. Check your API key.")
            mouth.wait_done(timeout=15)
            return

        # Speak greeting
        greeting = CFG["greeting"].replace("{name}", NAME)
        mouth.say(greeting)

        # Set up PTT
        ptt = PTTListener(CFG["ptt_key"])

        # Event loop
        loop = asyncio.get_event_loop()
        typed_q = queue.Queue()

        def _typed_reader(q):
            while True:
                try:
                    line = input()
                except (EOFError, OSError):
                    return
                if line:
                    q.put(line)

        threading.Thread(target=_typed_reader, args=(typed_q,), daemon=True).start()
        typed_fut = None

        async def handle(text: str) -> bool:
            """Process one utterance; returns False on quit."""
            if any(q in text.lower() for q in QUIT_PHRASES):
                mouth.shut_up()
                mouth.say(CFG["signoff"])
                mouth.wait_done(timeout=15)
                return False

            # Console commands
            norm = text.lower().strip()
            if norm in ("usage report", "usage"):
                s = brain.session
                msg = (f"{s['turns']} turns this session. "
                       f"Roughly {s['out_tokens']} tokens spoken out.")
                mouth.say(msg)
                return True
            if norm in ("clear session", "clear context", "clear"):
                await brain.reset()
                mouth.say("Context cleared.")
                return True

            set_state("thinking")
            static_start()

            await brain.reset_turn()
            speak_task = asyncio.create_task(
                speak_reply(brain, mouth, memory, text)
            )

            return True

        # Main loop
        press_fut = None
        typed_fut = None

        while True:
            if typed_fut is None:
                typed_fut = loop.run_in_executor(None, typed_q.get)
            if press_fut is None:
                press_fut = loop.run_in_executor(None, ptt.wait_press)

            waiters = {press_fut, typed_fut}
            done, _ = await asyncio.wait(
                waiters, return_when=asyncio.FIRST_COMPLETED
            )

            if typed_fut in done:
                text = typed_fut.result()
                typed_fut = None
                if text and not await handle(text):
                    break
                continue

            if press_fut in done:
                press_fut.result()
                press_fut = None
                mouth.shut_up()
                set_state("listening")
                print("[ptt] recording (release to send)...", flush=True)

                try:
                    text = await loop.run_in_executor(
                        None, lambda: record_held(ptt.is_held)
                    )
                except Exception as e:
                    log(f"[ears] record/transcribe failed: {e}")
                    mouth.say("My ears hit an error. Check the logs.")
                    text = None

                set_state("idle")
                if text and not await handle(text):
                    break

    elif args.chat:
        # Text-only chat mode
        await brain.start()
        print(f"\n{NAME} (text mode). Type 'quit' to exit.\n")

        while True:
            try:
                user_input = input("You: ").strip()
            except (EOFError, KeyboardInterrupt):
                break

            if not user_input or user_input.lower() in ("quit", "exit", "q"):
                break

            if any(q in user_input.lower() for q in QUIT_PHRASES):
                break

            set_state("thinking")
            full_response = []
            async for sentence in brain.ask_stream(user_input):
                print(f"{NAME}: {sentence}", flush=True)
                full_response.append(sentence)

            # Save to memory
            if full_response and CFG["memory"]["auto_save"]:
                memory.save_conversation(
                    f"User: {user_input}\nAgent: {' '.join(full_response)}"
                )

        await brain.stop()
        print(f"\n{NAME}: Goodbye!")

    elif args.web:
        # Web mode — launch the web server
        print("[agent] Starting web interface...")
        print("[agent] Run: cd web && npm run dev")
        print("[agent] Then open http://localhost:3000")


def main():
    try:
        asyncio.run(amain())
    except KeyboardInterrupt:
        print(f"\n[{NAME}] interrupted — hanging up", flush=True)


if __name__ == "__main__":
    main()
