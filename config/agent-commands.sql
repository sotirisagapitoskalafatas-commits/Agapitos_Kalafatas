-- ============================================================
-- Small Business Plugin — external integration credentials
-- ------------------------------------------------------------
-- Secure, service-role-only storage for third-party connector
-- tokens (QuickBooks, Stripe, HubSpot, PayPal, Square, Gmail,
-- Calendar, DocuSign, Slack, Canva).
--
-- The AI/agent NEVER reads raw tokens. The command executor
-- (server, service role) reads them to build authenticated
-- connector clients. RLS keeps anon/users completely out.
-- ============================================================

create table if not exists public.integration_credentials (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,            -- e.g. 'quickbooks', 'hubspot'
  label text,                            -- human-readable connector label
  encrypted_token text not null,         -- token/secret (encrypted at rest by app)
  metadata jsonb not null default '{}',  -- scopes, account, expires_at, etc.
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_name)
);

-- Strict RLS: nobody except the service role (server) may touch tokens.
alter table public.integration_credentials enable row level security;

drop policy if exists "Service role only access to integration tokens" on public.integration_credentials;
create policy "Service role only access to integration tokens"
  on public.integration_credentials
  for all
  to service_role
  using (true)
  with check (true);

-- Anon / authenticated roles get NO rows at all (default deny under RLS),
-- so connect status can be disclosed without leaking token material.
drop policy if exists "Service role only read integration enabled flags" on public.integration_credentials;
create policy "Service role only read integration enabled flags"
  on public.integration_credentials
  for select
  using (false);
