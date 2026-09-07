-- =============================================================================
-- 2026-09-08 — Social Account Connections + capability discovery (additive)
--
-- First slice of the Social Command Center's connection layer. It records which
-- Facebook/Instagram/YouTube/TikTok/LinkedIn accounts exist, what capabilities
-- the operator declares, and what a safe read-only probe verified. It does NOT
-- publish anything: publishing stays disabled until platform adapters are
-- implemented AND a verified connection grants the capability.
--
-- Tokens are kept out of this table: an optional link (credential_service) points
-- at a service_name row in the existing integration_credentials table, which is
-- expected to hold encrypted-at-rest tokens. Safe read probes only run under the
-- explicit private-deployment opt-in (INTEGRATION_TOKEN_IS_PLAINTEXT), matching
-- how the Stripe connector already behaves.
-- =============================================================================

-- ── 1) social connections ───────────────────────────────────────────────────
create table if not exists public.social_connections (
  id                    uuid primary key default gen_random_uuid(),
  platform              text not null
                          check (platform in ('facebook', 'instagram', 'youtube', 'tiktok', 'linkedin')),
  account_name          text not null,
  account_id            text,
  provider              text not null default 'manual' check (provider in ('oauth', 'api_key', 'manual')),
  credential_service    text,
  status                text not null default 'draft'
                          check (status in ('draft', 'connected', 'error', 'disabled')),
  scopes                text[] not null default '{}',
  capabilities_declared jsonb not null default '[]'::jsonb,
  capabilities_verified jsonb not null default '[]'::jsonb,
  health                jsonb not null default '{}'::jsonb,
  meta                  jsonb not null default '{}'::jsonb,
  created_by            text,
  created_at            timestamptz not null default timezone('utc', now()),
  updated_at            timestamptz not null default timezone('utc', now()),
  unique (platform, account_name)
);

alter table public.social_connections enable row level security;

create index if not exists social_connections_platform_idx
  on public.social_connections(platform, status);
create index if not exists social_connections_credential_idx
  on public.social_connections(credential_service);

comment on column public.social_connections.credential_service is
  'service_name of a row in integration_credentials holding the (encrypted at rest) token. Null means no token stored.';
comment on column public.social_connections.capabilities_declared is
  'Capability ids the operator declares the account should grant (e.g. pages_read).';
comment on column public.social_connections.capabilities_verified is
  'Capability ids confirmed by a safe READ-ONLY probe. Publish-adjacent capabilities stay here until a platform adapter exists.';
comment on column public.social_connections.health is
  'Result of the last read-only probe: {last_check_at, ok, message}.';