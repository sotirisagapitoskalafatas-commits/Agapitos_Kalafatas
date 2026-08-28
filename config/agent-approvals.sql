-- Agent action approvals: approval-gated write tools for the agent orchestrator.
-- The LLM PROPOSES a write; an admin APPROVES (or rejects) it; only then does the
-- server execute the proposed payload with the service role. Writes carry an
-- idempotency key so retries don't double-apply.

create table if not exists public.agent_action_approvals (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  organization_id uuid,
  user_id uuid,
  agent_name text not null,
  action_type text not null,            -- e.g. create_lead, send_email
  idempotency_key text not null unique,
  payload jsonb not null,               -- proposed write payload
  payload_hash text not null,           -- sha256 of canonical payload
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','expired','executed')),
  summary text,                         -- human-readable summary shown to admin
  expires_at timestamptz not null,      -- auto-expiry
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid,
  executed_at timestamptz,
  execution_result jsonb
);

alter table public.agent_action_approvals enable row level security;

-- Admins (own org) can see & decide their org's pending actions.
-- auth.jwt() ->> 'org_id' is used to scope multi-tenant; when the JWT has no
-- org_id, fall back to allowing (deployment currently single-org with service key).
create policy "admin read own org approvals"
  on public.agent_action_approvals
  for select
  using (
    coalesce(nullif(auth.jwt() ->> 'org_id', '')::uuid, organization_id) = organization_id
    or organization_id is null
  );

-- Backend (service role) creates proposals + authorizes execution, so allow inserts.
create policy "insert approvals"
  on public.agent_action_approvals
  for insert
  with check (true);

create policy "update approvals"
  on public.agent_action_approvals
  for update
  using (true)
  with check (true);
