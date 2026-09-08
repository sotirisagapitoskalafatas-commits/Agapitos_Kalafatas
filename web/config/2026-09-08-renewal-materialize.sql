-- =============================================================================
-- 2026-09-08 — Renewal Materialization (additive, reversible)
--
-- Turns idempotent renewal reminders into ONE CRM task (+ in-app notification
-- and optional owner email) per reminder, with the conflict-safe pattern:
--
--   * calendar_events.renewal_reminder_id uuid UNIQUE  -> deterministic key
--   * insert task ON CONFLICT (renewal_reminder_id) DO NOTHING RETURNING id
--   * notification + task_id link fire ONLY when a row actually comes back
--
-- Re-running run_renewal_materialize (manually or via pg_cron) can never
-- duplicate a task, a notification, or an owner email.
-- =============================================================================

-- ── 1) deterministic unique key on calendar_events ─────────────────────────
alter table public.calendar_events
  add column if not exists renewal_reminder_id uuid;

comment on column public.calendar_events.renewal_reminder_id is
  'Deterministic link to the renewal reminder that produced this task. UNIQUE so repeated materialization can never create a second task for the same reminder.';

create unique index if not exists calendar_events_renewal_reminder_idx
  on public.calendar_events(renewal_reminder_id)
  where renewal_reminder_id is not null;

alter table public.calendar_events
  add constraint calendar_events_renewal_reminder_fk
  foreign key (renewal_reminder_id) references public.renewal_reminders(id)
  on delete set null;

-- ── 2) renewal_reminders: task link + materialization audit columns ───────
alter table public.renewal_reminders
  add column if not exists task_id uuid,
  add column if not exists materialized_at timestamptz,
  add column if not exists owner_email_sent_at timestamptz;

alter table public.renewal_reminders
  add constraint renewal_reminders_task_fk
  foreign key (task_id) references public.calendar_events(id)
  on delete set null;

create index if not exists renewal_reminders_materialize_idx
  on public.renewal_reminders(window_days, status)
  where task_id is null;

-- ── 3) notifications: deterministic dedupe keyed to the reminder ───────────
alter table public.notifications
  add column if not exists renewal_reminder_id uuid;

create unique index if not exists notifications_renewal_reminder_idx
  on public.notifications(renewal_reminder_id)
  where renewal_reminder_id is not null;

-- ── 4) materialization function ────────────────────────────────────────────
-- One task per pending reminder in the action windows. The task is dated NOW
-- (it materializes an action, not the contract anniversary) with a lead_id link
-- so it surfaces in the CRM Calendar/Tasks. Idempotent even under concurrent
-- manual runs + pg_cron: only one insert can win the unique key.
create or replace function public.run_renewal_materialize(action_windows int[] default array[14,7,3,1])
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task_id uuid;
  v_materialized int := 0;
  v_rows int := 0;
  w int;
  r record;
begin
  foreach w in array action_windows loop
    if w <= 0 then
      continue;
    end if;

    for r in (
      select rm.id as reminder_id,
             rm.lead_id,
             rm.renewal_date,
             rm.window_days,
             l.full_name,
             l.email
      from public.renewal_reminders rm
      join public.leads l on l.id = rm.lead_id
      where rm.status = 'pending'
        and rm.window_days = w
        and rm.task_id is null
      order by rm.renewal_date asc
    ) loop
      insert into public.calendar_events
        (title, description, event_type, start_time, end_time,
         all_day, lead_id, location, color, completed, renewal_reminder_id)
      values (
        'Ανανέωση συμβολαίου — ' || coalesce(r.full_name, ''),
        'Ανανέωση στις ' || to_char(r.renewal_date, 'YYYY-MM-DD')
          || ' · Υπενθύμιση ' || r.window_days || ' ημερών',
        'reminder',
        now(),
        now(),
        false,
        r.lead_id,
        '',
        '#f59e0b',
        false,
        r.reminder_id
      )
      on conflict (renewal_reminder_id) where renewal_reminder_id is not null do nothing
      returning id into v_task_id;

      if v_task_id is not null then
        -- Only the winner of the unique key gets here: one task, one notif.
        insert into public.notifications
          (type, status, message, details, renewal_reminder_id)
        values (
          'renewal',
          'pending',
          'Ανανέωση συμβολαίου — ' || coalesce(r.full_name, ''),
          jsonb_build_object(
            'lead_id', r.lead_id,
            'renewal_date', to_char(r.renewal_date, 'YYYY-MM-DD'),
            'window_days', r.window_days,
            'task_id', v_task_id,
            'kind', 'materialized'
          ),
          r.reminder_id
        )
        on conflict (renewal_reminder_id) where renewal_reminder_id is not null do nothing;

        update public.renewal_reminders
           set task_id = v_task_id,
               materialized_at = timezone('utc', now())
         where id = r.reminder_id;

        v_materialized := v_materialized + 1;
      end if;
    end loop;

    get diagnostics v_rows = row_count;
  end loop;

  return v_materialized;
end;
$$;

revoke execute on function public.run_renewal_materialize(integer[]) from public, anon, authenticated;
grant execute on function public.run_renewal_materialize(integer[]) to service_role;

comment on function public.run_renewal_materialize(integer[]) is
  'Service-role only. Materializes up to one CRM task + notification per pending renewal reminder. Idempotent via calendar_events.renewal_reminder_id unique key.';

-- ── 5) pg_cron daily automation (scan -> materialize) ─────────────────────
-- Wrapper is security definer so the scheduler (postgres) can drive both
-- service-role-only functions daily. Direct anon/authenticated calls remain
-- denied because the underlying RPCs are.
create or replace function public.run_renewal_daily()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scanned int;
  v_materialized int;
begin
  select public.run_renewal_scan(array[90,60,30,14,7,3,1]) into v_scanned;
  select public.run_renewal_materialize(array[14,7,3,1]) into v_materialized;
  return v_materialized;
end;
$$;

revoke execute on function public.run_renewal_daily() from public, anon, authenticated;
grant execute on function public.run_renewal_daily() to service_role;

-- Schedule runs at 08:00 Europe/Athens (07:00 UTC Mar-Oct / differs DST via
-- the project's database timezone). Use a seed so re-applying is idempotent.
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'renewal-daily-atlas') then
    perform cron.schedule(
      'renewal-daily-atlas',
      '0 8 * * *',
      'select public.run_renewal_daily();'
    );
  end if;
end$$;