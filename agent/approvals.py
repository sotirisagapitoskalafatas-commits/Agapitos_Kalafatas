"""Approval gate for CRM WRITE tools in Slack (permission_mode: ask).

A requested write is staged in thread-scoped memory. The next message in that
same thread that is exactly a confirmation word ("yes"/"approve"/"ok") — or a
cancel word — resolves it. Entries expire after MAX_AGE so a stale "yes" can
never fire an old action.
"""
import time

PENDING: dict[tuple[str, str], list[dict]] = {}
MAX_AGE = 15 * 60  # seconds

WRITE_TOOLS = {
    "create_lead",
    "update_lead",
    "add_note_to_lead",
    "add_event",
    "add_communication",
}


def needs_approval(permission_mode: str) -> bool:
    return permission_mode != "bypassPermissions"


def is_write(name: str) -> bool:
    return name in WRITE_TOOLS


def store(key: tuple[str, str], tool: str, args: dict, user: str) -> dict:
    entry = {"tool": tool, "args": args, "user": user, "ts": time.time()}
    PENDING.setdefault(key, []).append(entry)
    return entry


def pop(key: tuple[str, str]) -> dict | None:
    queue = PENDING.get(key, [])
    while queue:
        entry = queue.pop(0)
        if time.time() - entry["ts"] <= MAX_AGE:
            return entry
    PENDING.pop(key, None)
    return None


def cancel(key: tuple[str, str]) -> int:
    return len(PENDING.pop(key, []))