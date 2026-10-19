-- 2026-10-19 — Survivor sandbox tables used by the CRM agent/ledger module.
-- Sandbox-only opportunity, proposal and simulated job data; the proposal executor
-- is approval-gated in the server code. All access is service-role only.
CREATE TABLE IF NOT EXISTS public.survivor_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'alive'
    CHECK (status IN ('alive', 'hybernating', 'dead')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.survivor_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.survivor_agents(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'spend', 'income', 'expense', 'payment')),
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  description text,
  reference_id text NOT NULL UNIQUE,
  balance_after numeric(14,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.survivor_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.survivor_agents(id) ON DELETE CASCADE,
  profile text NOT NULL DEFAULT 'balanced'
    CHECK (profile IN ('conservative', 'balanced', 'aggressive', 'entrepreneur')),
  active boolean NOT NULL DEFAULT true,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.survivor_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'sandbox',
  title text NOT NULL,
  description text,
  service_category text,
  estimated_value numeric(14,2) NOT NULL DEFAULT 0,
  complexity text NOT NULL DEFAULT 'medium'
    CHECK (complexity IN ('low', 'medium', 'high')),
  risk_percent numeric(5,2) NOT NULL DEFAULT 0
    CHECK (risk_percent >= 0 AND risk_percent <= 100),
  deadline_days integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.survivor_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.survivor_agents(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.survivor_opportunities(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'sandbox',
  score numeric(5,2) NOT NULL DEFAULT 0,
  decision text NOT NULL CHECK (decision IN ('bid', 'skip')),
  status text NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'approved', 'rejected', 'expired')),
  rationale text,
  approval_id uuid REFERENCES public.agent_action_approvals(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.survivor_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.survivor_agents(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.survivor_opportunities(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES public.survivor_proposals(id) ON DELETE SET NULL,
  title text NOT NULL,
  client text,
  value numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'won', 'in_progress', 'delivered', 'paid', 'failed')),
  win_rate numeric(5,2) NOT NULL DEFAULT 85
    CHECK (win_rate >= 0 AND win_rate <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.survivor_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.survivor_agents(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('lesson', 'postmortem', 'fact')),
  content text NOT NULL,
  source text,
  confidence numeric(4,3) NOT NULL DEFAULT 0.5
    CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.survivor_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'complete', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS survivor_transactions_agent_created_idx
  ON public.survivor_transactions(agent_id, created_at, id);
CREATE INDEX IF NOT EXISTS survivor_opportunities_active_created_idx
  ON public.survivor_opportunities(active, created_at DESC);
CREATE INDEX IF NOT EXISTS survivor_proposals_agent_created_idx
  ON public.survivor_proposals(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS survivor_jobs_agent_created_idx
  ON public.survivor_jobs(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS survivor_jobs_status_idx
  ON public.survivor_jobs(agent_id, status);
CREATE INDEX IF NOT EXISTS survivor_memory_agent_created_idx
  ON public.survivor_memory(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS survivor_strategies_active_idx
  ON public.survivor_strategies(agent_id, active, updated_at DESC);
CREATE INDEX IF NOT EXISTS survivor_experiments_created_idx
  ON public.survivor_experiments(created_at DESC);

DO $survivor_rls$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'survivor_agents',
    'survivor_transactions',
    'survivor_strategies',
    'survivor_opportunities',
    'survivor_proposals',
    'survivor_jobs',
    'survivor_memory',
    'survivor_experiments'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', t);
    EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role', t);
  END LOOP;
END;
$survivor_rls$;

DROP POLICY IF EXISTS "service role manages survivor_agents" ON public.survivor_agents;
CREATE POLICY "service role manages survivor_agents" ON public.survivor_agents
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service role manages survivor_transactions" ON public.survivor_transactions;
CREATE POLICY "service role manages survivor_transactions" ON public.survivor_transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service role manages survivor_strategies" ON public.survivor_strategies;
CREATE POLICY "service role manages survivor_strategies" ON public.survivor_strategies
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service role manages survivor_opportunities" ON public.survivor_opportunities;
CREATE POLICY "service role manages survivor_opportunities" ON public.survivor_opportunities
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service role manages survivor_proposals" ON public.survivor_proposals;
CREATE POLICY "service role manages survivor_proposals" ON public.survivor_proposals
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service role manages survivor_jobs" ON public.survivor_jobs;
CREATE POLICY "service role manages survivor_jobs" ON public.survivor_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service role manages survivor_memory" ON public.survivor_memory;
CREATE POLICY "service role manages survivor_memory" ON public.survivor_memory
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service role manages survivor_experiments" ON public.survivor_experiments;
CREATE POLICY "service role manages survivor_experiments" ON public.survivor_experiments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
