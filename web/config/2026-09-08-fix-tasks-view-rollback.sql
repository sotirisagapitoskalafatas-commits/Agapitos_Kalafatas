-- Reverts public.tasks to the foundation-migration state (due_at only, no
-- start_time column). Only run if you intentionally drop start_time exposure;
-- the tasks API orders by start_time and expects this column to exist.

create or replace view public.tasks as
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

alter view public.tasks set (security_invoker = true);