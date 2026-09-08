-- Versioned, repo-side equivalent of the ad-hoc live migration
-- `fix_tasks_view_start_time_column` (applied 2026-09-08T10:03 UTC but never
-- captured in the repo migration set).
--
-- History parity note: 2026-09-08-foundation-spine.sql is frozen to what the
-- foundation migration ACTUALLY created (the view exposed `start_time as due_at`
-- only). This file then exposes the real clock column that the tasks API orders
-- and range-queries by. Both applied together reproduce the live end state.

create or replace view public.tasks as
select
  id,
  title,
  description,
  event_type,
  start_time,
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

-- Security invoker so RLS on calendar_events applies to view users.
alter view public.tasks set (security_invoker = true);