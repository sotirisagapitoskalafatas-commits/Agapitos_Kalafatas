-- Agent Orchestrator audit tables
-- Run this in the Supabase SQL editor.

create table if not exists public.agent_audit (
  id bigint generated always as identity primary key,
  request_id text not null,
  organization_id uuid,
  user_id uuid,
  agent_name text not null,
  input text,
  output_summary text,
  tier text,
  provider text,
  model text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

alter table public.agent_audit enable row level security;

-- Service role bypasses RLS; admin can read own org's audit
create policy "admin read own org audit"
  on public.agent_audit
  for select
  using (organization_id = auth.jwt() ->> 'org_id'::text);

-- Allow inserts (service role inserts on behalf of tenant)
create policy "insert audit"
  on public.agent_audit
  for insert
  with check (true);
