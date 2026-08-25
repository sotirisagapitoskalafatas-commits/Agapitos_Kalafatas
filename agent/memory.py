"""Memory vault — persistent text-file memory for the agent.

Inspired by ai-memory-vault: the agent reads and writes plain text files
to remember the user, their work, and every lesson across sessions.
No database, no API — just files on disk the agent can browse.
"""
import os
import time
from datetime import datetime
from pathlib import Path

from agent.config import CFG
from agent.vlog import log


class MemoryVault:
    """A filing cabinet of plain text files for agent memory."""

    def __init__(self):
        self.vault_dir = Path(CFG["memory"]["vault_dir"])
        self.vault_dir.mkdir(parents=True, exist_ok=True)
        self._ensure_structure()

    def _ensure_structure(self):
        """Create the default memory structure."""
        dirs = [
            "lessons",
            "projects",
            "preferences",
            "conversations",
            "skills",
        ]
        for d in dirs:
            (self.vault_dir / d).mkdir(exist_ok=True)

        # Create a README if vault is empty
        readme = self.vault_dir / "README.md"
        if not readme.exists():
            readme.write_text(
                "# Agent Memory Vault\n\n"
                "This vault stores persistent memory for your AI agent.\n"
                "The agent reads and writes files here to remember you,\n"
                "your work, and every lesson across sessions.\n\n"
                "## Structure\n"
                "- `lessons/` — Things learned from our work together\n"
                "- `projects/` — Project context and status\n"
                "- `preferences/` — Your preferences and settings\n"
                "- `conversations/` — Notable conversation summaries\n"
                "- `skills/` — Skills the agent has learned\n\n"
                "Files are plain text — you can read and edit them directly.\n",
                encoding="utf-8",
            )

    def read(self, path: str) -> str:
        """Read a file from the vault."""
        full_path = self.vault_dir / path
        if full_path.exists():
            return full_path.read_text(encoding="utf-8")
        return ""

    def write(self, path: str, content: str):
        """Write a file to the vault."""
        full_path = self.vault_dir / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content, encoding="utf-8")
        log(f"[memory] wrote {path}")

    def append(self, path: str, content: str):
        """Append to a file in the vault."""
        full_path = self.vault_dir / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_path, "a", encoding="utf-8") as f:
            f.write(content + "\n")

    def list_files(self, subdir: str = "") -> list[str]:
        """List all files in the vault (or a subdirectory)."""
        base = self.vault_dir / subdir if subdir else self.vault_dir
        files = []
        for item in sorted(base.rglob("*")):
            if item.is_file() and not item.name.startswith("."):
                rel = item.relative_to(self.vault_dir)
                files.append(str(rel))
        return files

    def save_conversation(self, summary: str):
        """Save a conversation summary."""
        date = datetime.now().strftime("%Y-%m-%d")
        time_str = datetime.now().strftime("%H:%M")
        path = f"conversations/{date}.md"
        content = f"\n## {time_str}\n{summary}\n"
        self.append(path, content)

    def save_lesson(self, topic: str, lesson: str):
        """Save a lesson learned."""
        path = f"lessons/{topic.replace(' ', '_').lower()}.md"
        content = f"\n## {datetime.now().strftime('%Y-%m-%d %H:%M')}\n{lesson}\n"
        self.append(path, content)

    def save_project(self, name: str, details: str):
        """Save project context."""
        path = f"projects/{name.replace(' ', '_').lower()}.md"
        content = f"\n## {datetime.now().strftime('%Y-%m-%d %H:%M')}\n{details}\n"
        self.append(path, content)

    def get_context(self, max_chars: int = 4000) -> str:
        """Get recent memory context for the agent."""
        context_parts = []

        # Get recent conversations
        conv_dir = self.vault_dir / "conversations"
        if conv_dir.exists():
            conv_files = sorted(conv_dir.glob("*.md"), reverse=True)[:3]
            for f in conv_files:
                content = f.read_text(encoding="utf-8")
                if content.strip():
                    context_parts.append(f"Recent conversation ({f.stem}):\n{content}")

        # Get lessons
        lessons_dir = self.vault_dir / "lessons"
        if lessons_dir.exists():
            for f in sorted(lessons_dir.glob("*.md"))[:5]:
                content = f.read_text(encoding="utf-8")
                if content.strip():
                    context_parts.append(f"Lesson ({f.stem}):\n{content}")

        # Get preferences
        prefs_dir = self.vault_dir / "preferences"
        if prefs_dir.exists():
            for f in sorted(prefs_dir.glob("*.md")):
                content = f.read_text(encoding="utf-8")
                if content.strip():
                    context_parts.append(f"Preference ({f.stem}):\n{content}")

        # Truncate to max_chars
        result = "\n\n".join(context_parts)
        if len(result) > max_chars:
            result = result[:max_chars] + "\n... (truncated)"

        return result
