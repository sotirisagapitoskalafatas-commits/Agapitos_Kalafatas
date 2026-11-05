-- Versioned, additive repair of the tasks view.
-- The foundation-spine migration originally exposed start_time as due_at.
-- PostgreSQL CREATE OR REPLACE VIEW cannot rename/reorder existing columns.
-- Preserve the existing column order and append start_time as a new column.

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
  created_at,
  start_time
from public.calendar_events
where event_type in ('task', 'reminder');

alter view public.tasks set (security_invoker = true);
