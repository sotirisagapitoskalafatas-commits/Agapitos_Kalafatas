-- =============================================================================
-- ROLLBACK — 2026-09-08-renewal-materialize.sql
--
-- Reverts materialization cleanly. Data removal is intentionally scoped:
--   * cron job removed (no more daily automation)
--   * materialization columns dropped from renewal_reminders / notifications
--   * calendar_events.renewal_reminder_id dropped (unique + FK)
-- Tasks already materialized into calendar_events are KEPT (they are normal
-- CRM reminders once the link is gone); only their tie to the reminder is cut.
-- =============================================================================

-- Drop pg_cron job if present.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'renewal-daily-atlas') then
    perform cron.unschedule('renewal-daily-atlas');
  end if;
end$$;

drop function if exists public.run_renewal_daily();

-- Drop calendar_events link (FK first, then column / index).
alter table public.calendar_events
  drop constraint if exists calendar_events_renewal_reminder_fk;
drop index if exists calendar_events_renewal_reminder_idx;
alter table public.calendar_events
  drop column if exists renewal_reminder_id;

-- Drop reminder materialization columns.
alter table public.renewal_reminders
  drop constraint if exists renewal_reminders_task_fk;
drop index if exists renewal_reminders_materialize_idx;
alter table public.renewal_reminders
  drop column if exists task_id,
  drop column if exists materialized_at,
  drop column if exists owner_email_sent_at;

-- Drop notification dedupe key.
drop index if exists notifications_renewal_reminder_idx;
alter table public.notifications
  drop column if exists renewal_reminder_id;

drop function if exists public.run_renewal_materialize(integer[]);