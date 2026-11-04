-- Keep the Survivor sandbox foreign-key joins indexed.
-- This additive migration is safe to re-run in Supabase SQL Editor.
begin;

create index if not exists survivor_jobs_opportunity_id_idx
  on public.survivor_jobs (opportunity_id);

create index if not exists survivor_jobs_proposal_id_idx
  on public.survivor_jobs (proposal_id);

create index if not exists survivor_proposals_approval_id_idx
  on public.survivor_proposals (approval_id);

create index if not exists survivor_proposals_opportunity_id_idx
  on public.survivor_proposals (opportunity_id);

commit;
