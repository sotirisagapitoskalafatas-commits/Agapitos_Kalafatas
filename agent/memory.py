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
