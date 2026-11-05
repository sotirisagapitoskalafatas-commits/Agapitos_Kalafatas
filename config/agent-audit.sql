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

-- CRM accesses this table only through authenticated server routes that use
-- the service role. Do not grant anon/authenticated arbitrary audit insertion.
drop policy if exists "admin read own org audit" on public.agent_audit;
drop policy if exists "insert audit" on public.agent_audit;
drop policy if exists "service role manages agent audit" on public.agent_audit;
create policy "service role manages agent audit"
  on public.agent_audit
  for all to service_role
  using (true) with check (true);
