-- =============================================================================
-- 2026-09-08 — Atlas OS Creative Studio (additive, reversible)
--
-- First production-ready building block of the Social Command Center.
-- Supports AI image generation, ad-copy generation, campaign assets,
-- media library, approval workflow, brand guard + compliance guard and
-- full generation audit. No publishing tables: external publishing stays
-- disabled until the corresponding platform adapters (Facebook, Instagram,
-- YouTube, TikTok, LinkedIn) are implemented and verified.
--
-- Runtime validation uses these objects only (service-role access):
--   * creative_campaigns           -> campaign metadata (service/audience/objective/...)
--   * creative_assets              -> generated/uploaded creatives + workflow state
--   * creative_asset_variants      -> per-platform / per-language copy variants
--   * creative_runs                -> append-only audit of every generation/verification
--   * brand_rule                   -> brand guard + compliance rules (seeded defaults)
--   * storage bucket 'creative-assets' -> generated images / source media
-- =============================================================================

-- ── 1) campaigns ───────────────────────────────────────────────────────────
create table if not exists public.creative_campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  service     text,
  audience    text,
  objective   text,
  tone        text,
  language    text not null default 'en' check (language in ('en', 'gr', 'fr')),
  status      text not null default 'active' check (status in ('active', 'paused', 'archived')),
  notes       text,
  meta        jsonb not null default '{}'::jsonb,
  created_by  text,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

alter table public.creative_campaigns enable row level security;

-- ── 2) assets: the central media/creative record with workflow state ───────
create table if not exists public.creative_assets (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid references public.creative_campaigns(id) on delete set null,
  asset_type      text not null check (asset_type in ('image', 'copy', 'creative_set')),
  kind            text not null default 'generated_image'
                    check (kind in ('generated_image', 'uploaded_image', 'ad_copy', 'full_creative')),
  title           text not null default 'Untitled asset',
  status          text not null default 'DRAFT'
                    check (status in (
                      'DRAFT', 'AI_GENERATED', 'VERIFICATION',
                      'PENDING_APPROVAL', 'APPROVED', 'READY_TO_PUBLISH', 'REJECTED'
                    )),
  prompt          text,
  source_path     text,
  ref_image_path  text,
  asset_path      text,
  mime_type       text,
  model           text,
  creator         text not null default 'user' check (creator in ('user', 'agent')),
  language        text,
  platforms       text[] not null default '{}',
  tags            text[] not null default '{}',
  version         int  not null default 1,
  parent_asset_id uuid references public.creative_assets(id) on delete set null,
  checks          jsonb not null default '{}'::jsonb,
  meta            jsonb not null default '{}'::jsonb,
  created_by      text,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

alter table public.creative_assets enable row level security;

create index if not exists creative_assets_status_idx
  on public.creative_assets(status, updated_at desc);
create index if not exists creative_assets_campaign_idx
  on public.creative_assets(campaign_id);
create index if not exists creative_assets_tags_idx
  on public.creative_assets using gin (tags);

-- Version history lineage: version 1 has parent_asset_id null, every revision
-- points at the record it forked from.
comment on column public.creative_assets.parent_asset_id is
  'Points to the asset this revision forked from. Version 1 has NULL. Enables full version history.';

-- ── 3) per-platform / per-language copy variants ───────────────────────────
create table if not exists public.creative_asset_variants (
  id           uuid primary key default gen_random_uuid(),
  asset_id     uuid not null references public.creative_assets(id) on delete cascade,
  platform     text not null
                 check (platform in ('facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'web', 'generic')),
  language     text not null default 'en' check (language in ('en', 'gr', 'fr')),
  headline     text,
  primary_text text,
  short_text   text,
  cta          text,
  hashtags     text[] not null default '{}',
  alt_text     text,
  status       text not null default 'AI_GENERATED' check (status in ('DRAFT', 'AI_GENERATED', 'APPROVED', 'REJECTED')),
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default timezone('utc', now()),
  updated_at   timestamptz not null default timezone('utc', now()),
  unique (asset_id, platform, language)
);

alter table public.creative_asset_variants enable row level security;

-- ── 4) append-only generation/verification audit ───────────────────────────
create table if not exists public.creative_runs (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('image', 'copy', 'verify', 'approve')),
  asset_id     uuid references public.creative_assets(id) on delete set null,
  campaign_id  uuid references public.creative_campaigns(id) on delete set null,
  actor        text not null default 'user',
  actor_role   text not null default 'user',
  prompt       text,
  source_path  text,
  output_path  text,
  model        text,
  status       text,
  result       jsonb not null default '{}'::jsonb,
  duration_ms  int,
  created_at   timestamptz not null default timezone('utc', now())
);

alter table public.creative_runs enable row level security;

create index if not exists creative_runs_asset_idx on public.creative_runs(asset_id, created_at desc);
create index if not exists creative_runs_campaign_idx on public.creative_runs(campaign_id, created_at desc);

-- ── 5) brand guard + compliance rules (seeded defaults below) ──────────────
create table if not exists public.brand_rule (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  rule_type  text not null
               check (rule_type in (
                 'brand_voice', 'visual', 'prohibited_claims', 'factual',
                 'language', 'cta', 'pii', 'formatting', 'compliance'
               )),
  content    text not null,
  active     boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.brand_rule enable row level security;

create unique index if not exists brand_rule_name_type_idx
  on public.brand_rule(name, rule_type);

-- ── 6) storage bucket for generated/uploaded creative media ────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types, owner_id)
values (
  'creative-assets',
  'creative-assets',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/octet-stream'],
  null
)
on conflict (id) do nothing;

-- Public reads so generated media previews work in the admin UI; writes are
-- service-role only (bypasses storage policies) so they need no policy.
create policy "creative-assets public read"
  on storage.objects for select
  using (bucket_id = 'creative-assets');

-- ── 7) seed default brand/compliance rules (idempotent) ────────────────────
insert into public.brand_rule (name, rule_type, content) values
  ('Brand voice', 'brand_voice',
   'Professional, warm, concrete and concise. Speak the customer''s language (en/gr/fr). Clear benefits, no hype, no pressure.' ),
  ('Practicality over hype', 'brand_voice',
   'Lead with clear, practical benefits. Avoid empty superlatives and exaggerated marketing language.'),
  ('No absolute claims', 'prohibited_claims',
   'Never claim "best", "cheapest", "guaranteed", "100%", "risk-free" or any absolute, unprovable claim without a verifiable source.'),
  ('Energy savings honesty', 'prohibited_claims',
   'Energy savings figures and payback periods must be sourced and realistic. Never promise a specific distance/production figure as fact.'),
  ('Insurance caution', 'compliance',
   'Insurance content is regulated. Do not present examples as promises of coverage or payout. Flag terms like "covers everything", "full coverage", "free", "save X% guaranteed" for human review.'),
  ('Financial/regulated language', 'compliance',
   'Financial and investment statements must be generic, non-advisory and clearly non-guaranteed. Flag return/investment claims for human review.'),
  ('No personal data in creative copy', 'pii',
   'Generated marketing copy and image overlays must not contain emails, phone numbers, IBANs, addresses or personal identifiers.'),
  ('Visual consistency', 'visual',
   'Use the Agapitos Kalafatas palette (slate + amber), a clean modern layout, and the brand''s service identity (web/digital, energy, insurance) in the image subject.'),
  ('Factual grounding', 'factual',
   'Never fabricate stats, prices, client counts or results. If a number is used it must come from supplied, approved material or be clearly illustrative.'),
  ('CTA clarity', 'cta',
   'Each ad must contain one clear, actionable CTA (e.g. Book a free consultation, Learn more, Get a free quote) consistent with the objective.'),
  ('Language correctness', 'language',
   'Match the target language exactly. Greek ads must be grammatically correct modern Greek; French ads correct French. No machine-translation artifacts.')
on conflict (name, rule_type) do nothing;