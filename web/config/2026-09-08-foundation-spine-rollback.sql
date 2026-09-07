-- =============================================================================
-- 2026-09-08 — Atlas OS Foundation Spine — ROLLBACK
--
-- Drops everything introduced by 2026-09-08-foundation-spine.sql and restores
-- the pre-migration schema. Run in a transaction inside the Supabase SQL editor:
--   BEGIN;   <paste this file>   COMMIT;
--
-- No application release is required for rollback in either direction: the
-- app code writes new columns best-effort and degrades gracefully when they
-- are absent (see API routes + lib/spine/server.ts).
-- =============================================================================

drop function if exists public.run_renewal_scan(int[]);
drop table  if exists public.renewal_reminders;
drop view   if exists public.tasks;
drop table  if exists public.consent_log;

alter table public.leads
  drop column if exists landing_path,
  drop column if exists referrer,
  drop column if exists utm_content,
  drop column if exists utm_term,
  drop column if exists utm_campaign,
  drop column if exists utm_medium,
  drop column if exists utm_source,
  drop column if exists idempotency_key,
  drop column if exists ack_sent_at,
  drop column if exists consent_source,
  drop column if exists consent_granted_at,
  drop column if exists consent_version;

-- Indexed columns above are dropped with their columns; the renewal_date index
-- was added by the spine and is safe to keep or drop:
-- drop index if exists public.leads_renewal_date_idx;
-- drop index if exists public.calendar_events_tasks_idx;