"""CRM tools for the Slack bot — service-role Supabase PostgREST access.

The robot talks to the CRM strictly server-side under the service role, so RLS
stays locked out for anon/key users. READs are free; WRITEs are limited to
curated columns on the tables that back the web CRM (leads, deals, events,
communications). Everything returns a plain dict so it can be fed straight
back to Gemini as a FunctionResponse.
"""
import os
import logging

import httpx

log = logging.getLogger("agent.crm")

BASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
REST = f"{BASE_URL}/rest/v1"

SHORT_STATUS = ("new_lead", "contacted", "customer", "archived")


def _status(value):
    """Normalize the many legacy status spellings to the CRM set."""
    v = str(value or "").lower()
    if v in ("new", "new_lead", "novo"):
        return "new_lead"
    if v in ("contacted", "contacted", "contact"):
        return "contacted"
    if v in ("qualified", "proposal", "negotiation", "won", "customer",
             "in progress", "in_progress"):
        return "customer"
    if v in ("lost", "archived"):
        return "archived"
    return v


def _args(args):
    """Deep-convert protobuf/Mapping args to plain JSON-able dict."""
    if isinstance(args, dict):
        return {k: _args(v) for k, v in args.items()}
    if isinstance(args, (list, tuple)):
        return [_args(v) for v in args]
    return args


def _client() -> httpx.Client | None:
    if not BASE_URL or not SERVICE_KEY:
        return None
    return httpx.Client(
        base_url=REST,
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Accept": "application/json",
        },
        timeout=20.0,
    )


def _rows(resp: httpx.Response) -> list:
    if resp.status_code >= 400:
        raise RuntimeError(f"Supabase {resp.status_code}: {resp.text[:200]}")
    data = resp.json()
    return data if isinstance(data, list) else [data]


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def search_leads(query: str, limit: int = 5) -> dict:
    with _client() as c:
        resp = c.get(
            "/leads",
            params={
                "select": "id,first_name,last_name,full_name,email,phone,company,"
                          "status,service_category,notes,created_at",
                "or": f"(first_name.ilike.*{query}*,last_name.ilike.*{query}*,"
                      f"full_name.ilike.*{query}*,email.ilike.*{query}*,"
                      f"company.ilike.*{query}*)",
                "order": "created_at.desc",
                "limit": int(limit),
            },
        )
    return {"ok": True, "leads": _rows(resp)}


def list_recent_leads(limit: int = 5) -> dict:
    with _client() as c:
        resp = c.get(
            "/leads",
            params={
                "select": "id,first_name,last_name,full_name,email,phone,company,"
                          "status,service_category,created_at",
                "order": "created_at.desc",
                "limit": int(limit),
            },
        )
    return {"ok": True, "leads": _rows(resp)}


def lead_summary() -> dict:
    with _client() as c:
        resp = c.get("/leads", params={"select": "id,status,service_category"})
    rows = _rows(resp)
    total = len(rows)
    by_status: dict = {}
    for r in rows:
        by_status[r.get("status") or "unknown"] = by_status.get(r.get("status") or "unknown", 0) + 1
    return {"ok": True, "total": total, "by_status": by_status}


def create_lead(first_name: str = "", last_name: str = "", full_name: str = "",
                email: str = "", phone: str = "", company: str = "",
                service_category: str = "Ρεύμα", source: str = "slack",
                notes: str = "") -> dict:
    first = (first_name or full_name or "Slack Lead").strip()
    last = (last_name or "").strip()
    with _client() as c:
        resp = c.post(
            "/leads",
            params={"select": "id,first_name,last_name,email,status,created_at"},
            headers={"Prefer": "return=representation"},
            json={
                "first_name": first,
                "last_name": last,
                "full_name": full_name or f"{first} {last}".strip(),
                "email": email or "",
                "phone": phone or "",
                "company": company or "",
                "service_category": service_category or "Ρεύμα",
                "source": source,
                "notes": notes or "",
                "status": "new_lead",
            },
        )
    rows = _rows(resp)
    created = rows[0] if rows else {}
    return {"ok": True, "created": True, "lead": created}


def update_lead(lead_id: str, updates: dict) -> dict:
    allowed = {
        "status", "first_name", "last_name", "full_name", "email", "phone",
        "company", "service_category", "notes", "source", "tags",
    }
    clean = {k: v for k, v in updates.items() if k in allowed and v is not None}
    if "status" in clean:
        clean["status"] = _status(clean["status"])
    if not clean:
        return {"ok": False, "error": "No supported fields to update."}
    with _client() as c:
        resp = c.patch(
            "/leads",
            params={
                "select": "id,first_name,last_name,email,status,notes,updated_at",
                "id": f"eq.{lead_id}",
            },
            headers={"Prefer": "return=representation"},
            json=clean,
        )
    rows = _rows(resp)
    if not rows:
        return {"ok": False, "error": "Lead not found."}
    return {"ok": True, "updated": True, "lead": rows[0]}


def add_note_to_lead(lead_id: str, note: str) -> dict:
    with _client() as c:
        resp = c.patch(
            "/leads",
            params={"select": "id,first_name,notes", "id": f"eq.{lead_id}"},
            headers={"Prefer": "return=representation"},
            json={"notes": (note or "").strip()},
        )
    rows = _rows(resp)
    if not rows:
        return {"ok": False, "error": "Lead not found."}
    return {"ok": True, "note_added": True, "lead": rows[0]}


def list_deals(stage: str = "") -> dict:
    params = {
        "select": "id,title,value,currency,stage,expected_close_date,notes,updated_at",
        "order": "value.desc",
        "limit": 10,
    }
    if stage:
        params["stage"] = f"eq.{stage}"
    with _client() as c:
        resp = c.get("/deals", params=params)
    return {"ok": True, "deals": _rows(resp)}


def pipeline_value() -> dict:
    with _client() as c:
        resp = c.get("/deals", params={"select": "title,value,stage"})
    rows = _rows(resp)
    open_deals = [r for r in rows
                  if not (r.get("stage") or "").startswith("closed_")
                  and r.get("stage") not in ("won", "lost")]
    open_value = sum(float(r.get("value") or 0) for r in open_deals)
    return {"ok": True, "open_value": open_value, "open_count": len(open_deals)}


def add_event(title: str, starts_at: str, lead_id: str = "", description: str = "",
             event_type: str = "meeting") -> dict:
    payload = {"title": title, "starts_at": starts_at,
               "event_type": event_type if event_type in
               ("meeting", "call", "follow_up", "deadline", "other") else "meeting"}
    if description:
        payload["description"] = description
    if lead_id:
        payload["lead_id"] = lead_id
    with _client() as c:
        resp = c.post(
            "/events",
            params={"select": "id,title,starts_at,event_type"},
            headers={"Prefer": "return=representation"},
            json=payload,
        )
    rows = _rows(resp)
    return {"ok": True, "created": True, "event": rows[0] if rows else payload}


def add_communication(lead_id: str, channel: str = "email", subject: str = "",
                      body: str = "", direction: str = "outbound") -> dict:
    payload = {
        "lead_id": lead_id,
        "channel": channel if channel in
        ("email", "phone", "sms", "whatsapp", "linkedin", "other") else "email",
        "direction": direction if direction in ("inbound", "outbound") else "outbound",
        "subject": subject or "",
        "body": body or "",
    }
    with _client() as c:
        resp = c.post(
            "/communications",
            params={"select": "id,lead_id,channel,subject,direction"},
            headers={"Prefer": "return=representation"},
            json=payload,
        )
    rows = _rows(resp)
    return {"ok": True, "created": True, "comm": rows[0] if rows else payload}


# ---------------------------------------------------------------------------
# Tool registry (used to build Gemini function declarations + dispatch)
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "name": "search_leads",
        "description": "Search CRM leads by name/email/company. Returns up to `limit` matches.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search text (name, email or company)."},
                "limit": {"type": "integer", "description": "Max results (default 5)."},
            },
            "required": ["query"],
        },
        "fn": search_leads,
    },
    {
        "name": "list_recent_leads",
        "description": "List the most recent CRM leads.",
        "parameters": {
            "type": "object",
            "properties": {"limit": {"type": "integer", "description": "Max results (default 5)."}},
            "required": [],
        },
        "fn": list_recent_leads,
    },
    {
        "name": "lead_summary",
        "description": "CRM health: total leads and count by status.",
        "parameters": {"type": "object", "properties": {}, "required": []},
        "fn": lead_summary,
    },
    {
        "name": "create_lead",
        "description": "Add a NEW CRM lead. First name (or full name) is required.",
        "parameters": {
            "type": "object",
            "properties": {
                "first_name": {"type": "string"},
                "last_name": {"type": "string"},
                "full_name": {"type": "string"},
                "email": {"type": "string"},
                "phone": {"type": "string"},
                "company": {"type": "string"},
                "service_category": {"type": "string", "description": "Service interest (e.g. Ρεύμα, Website, E-shop, SaaS)."},
                "notes": {"type": "string"},
                "source": {"type": "string"},
            },
            "required": [],
        },
        "fn": create_lead,
    },
    {
        "name": "update_lead",
        "description": "Update an EXISTING lead (status, contact info, service category, notes). Returns the updated row.",
        "parameters": {
            "type": "object",
            "properties": {
                "lead_id": {"type": "string", "description": "UUID of the lead."},
                "updates": {
                    "type": "object",
                    "description": "Fields to change. status should be one of: new_lead, contacted, customer, archived.",
                    "properties": {
                        "status": {"type": "string"},
                        "first_name": {"type": "string"},
                        "last_name": {"type": "string"},
                        "email": {"type": "string"},
                        "phone": {"type": "string"},
                        "company": {"type": "string"},
                        "service_category": {"type": "string"},
                        "notes": {"type": "string"},
                        "source": {"type": "string"},
                    },
                },
            },
            "required": ["lead_id", "updates"],
        },
        "fn": update_lead,
    },
    {
        "name": "add_note_to_lead",
        "description": "Attach a note to an existing lead.",
        "parameters": {
            "type": "object",
            "properties": {
                "lead_id": {"type": "string"},
                "note": {"type": "string"},
            },
            "required": ["lead_id", "note"],
        },
        "fn": add_note_to_lead,
    },
    {
        "name": "list_deals",
        "description": "List deals/pipeline (optionally filtered by stage).",
        "parameters": {
            "type": "object",
            "properties": {"stage": {"type": "string", "description": "Optional deal stage filter."}},
            "required": [],
        },
        "fn": list_deals,
    },
    {
        "name": "pipeline_value",
        "description": "Open pipeline value and weighted value.",
        "parameters": {"type": "object", "properties": {}, "required": []},
        "fn": pipeline_value,
    },
    {
        "name": "add_event",
        "description": "Schedule an event (meeting/call/follow_up/deadline) on the calendar.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "starts_at": {"type": "string", "description": "ISO-8601 start time, e.g. 2026-09-08T10:00:00Z"},
                "lead_id": {"type": "string", "description": "Optional lead UUID."},
                "description": {"type": "string"},
                "event_type": {"type": "string"},
            },
            "required": ["title", "starts_at"],
        },
        "fn": add_event,
    },
    {
        "name": "add_communication",
        "description": "Log a communication with a lead (email/phone/sms/whatsapp/linkedin).",
        "parameters": {
            "type": "object",
            "properties": {
                "lead_id": {"type": "string"},
                "channel": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"},
                "direction": {"type": "string"},
            },
            "required": ["lead_id"],
        },
        "fn": add_communication,
    },
]


def function_declarations():
    return [
        {
            "name": t["name"],
            "description": t["description"],
            "parameters": t["parameters"],
        }
        for t in TOOLS
    ]


def dispatch(name: str, raw_args) -> dict:
    args = _args(raw_args) if raw_args else {}
    for tool in TOOLS:
        if tool["name"] == name:
            log.info("[crm] tool=%s args=%s", name, args)
            return tool["fn"](**args)
    return {"ok": False, "error": f"Unknown tool: {name}"}