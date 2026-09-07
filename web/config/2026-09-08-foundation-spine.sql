-- =============================================================================
-- 2026-09-08 — Atlas OS Foundation Spine (additive, reversible)
--
-- Applies against the existing Agapitos Kalafatas Supabase project. Everything
-- here is additive: new columns, new tables, one view, one function, indexes.
-- No existing column, table, or behavior is modified or removed.
--
-- Runtime validation uses nothing from this file except the columns/tables:
--   * leads.idempotency_key            -> dedupes parallel/retried submissions
--   * leads.consent_* / ack_sent_at    -> consent + auto-ack state
--   * leads.utm_* / referrer / landing -> source attribution
--   * consent_log                       -> append-only GDPR consent audit trail
--   * renewal_reminders + run_renewal_scan -> idempotent renewal engine ledger
--   * tasks view / calendar_events idx  -> events-tasks foundation
-- =============================================================================

-- ── 1) leads: attribution + consent + auto-ack + idempotency columns ──────
alter table public.leads
  add column if not exists consent_version  text      not null default 'v1',
  add column if not exists consent_granted_at timestamptz,
  add column if not exists consent_source   text,
  add column if not exists ack_sent_at      timestamptz,
  add column if not exists idempotency_key  uuid,
  add column if not exists utm_source       text,
  add column if not exists utm_medium       text,
  add column if not exists utm_campaign     text,
  add column if not exists utm_term         text,
  add column if not exists utm_content      text,
  add column if not exists referrer         text,
  add column if not exists landing_path     text;

comment on column public.leads.idempotency_key is
  'Client-generated UUID. Unique per submission so retried/parallel submits return the same lead instead of inserting a duplicate.';

create unique index if not exists leads_idempotency_key_idx on public.leads(idempotency_key)
  where idempotency_key is not null;
create index if not exists leads_renewal_date_idx on public.leads(renewal_date)
  where renewal_date is not null;

-- Backfill: rows captured before this migration assumed consent at capture time.
update public.leads
  set consent_granted_at = created_at
  where gdpr_consent = true and consent_granted_at is null;

-- ── 2) append-only consent audit trail ─────────────────────────────────────
create table if not exists public.consent_log (
  id              uuid primary key default gen_random_uuid(),
  entity_type     text      not null default 'lead',
  entity_id       uuid,
  email           text,
  consent_version text      not null default 'v1',
  granted         boolean   not null,
  source          text,
  ip              text,
  user_agent      text,
  details         jsonb     not null default '{}'::jsonb,
  created_at      timestamptz not null default timezone('utc', now())
);

alter table public.consent_log enable row level security;

create index if not exists consent_log_entity_idx
  on public.consent_log(entity_type, entity_id, created_at desc);

-- ── 3) renewal engine: idempotent reminder ledger ──────────────────────────
create table if not exists public.renewal_reminders (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete cascade,
  renewal_date    date not null,
  window_days     int  not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'sent', 'dismissed')),
  due_at          timestamptz not null,
  idempotency_key text not null unique,
  sent_at         timestamptz,
  created_at      timestamptz not null default timezone('utc', now()),
  unique (lead_id, renewal_date, window_days)
);

alter table public.renewal_reminders enable row level security;

create index if not exists renewal_reminders_due_idx
  on public.renewal_reminders(due_at) where status = 'pending';
create index if not exists renewal_reminders_lead_idx
  on public.renewal_reminders(lead_id);

-- Idempotent scan: for each configured window it emits exactly one pending
-- reminder per customer lead whose renewal_date falls within that window.
-- Re-running is safe and creates nothing new.
create or replace function public.run_renewal_scan(active_days int[] default array[90,60,30,14,7,3,1])
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  w int;
  v_inserted int := 0;
begin
  foreach w in array active_days loop
    if w <= 0 then
      continue;
    end if;
    insert into public.renewal_reminders
      (lead_id, renewal_date, window_days, status, due_at, idempotency_key)
    select
      l.id,
      l.renewal_date,
      w,
      'pending',
      now(),
      'renew:' || l.id::text || ':' || l.renewal_date::text || ':' || w
    from public.leads l
    where l.status = 'customer'
      and l.renewal_date is not null
      and l.renewal_date between current_date and current_date + w
    on conflict (lead_id, renewal_date, window_days) do nothing;
    v_inserted := v_inserted + row_count;
  end loop;
  return v_inserted;
end;
$$;

-- ── 4) events/tasks foundation ─────────────────────────────────────────────
create index if not exists calendar_events_tasks_idx
  on public.calendar_events(event_type, completed, start_time);

drop view if exists public.tasks;
create view public.tasks as
select
  id,
  title,
  description,
  event_type,
  start_time as due_at,
  end_time,
  all_day,
  lead_id,
  deal_id,
  location,
  color,
  completed,
  created_at
from public.calendar_events
where event_type in ('task', 'reminder');