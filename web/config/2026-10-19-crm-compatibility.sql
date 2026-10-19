-- =============================================================================
-- 2026-10-19 — fresh Supabase project CRM compatibility layer
--
-- Apply AFTER web/config/schema.sql and web/config/2026-09-07-lead-folder.sql,
-- BEFORE foundation-spine.sql and renewal-materialize.sql.
--
-- This migration adds columns already queried by the current CRM and creates
-- the service-request table used by Customer 360. It is additive and safe to
-- re-run on the current empty/new project.
-- =============================================================================

-- Leads are the canonical customer records. Some CRM/agent views still read
-- legacy display-name fields, so keep them populated while first/last name are
-- the editable canonical fields.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

UPDATE public.leads
SET
  full_name = COALESCE(NULLIF(BTRIM(full_name), ''), NULLIF(BTRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '')),
  client_name = COALESCE(NULLIF(BTRIM(client_name), ''), NULLIF(BTRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '')),
  updated_at = COALESCE(updated_at, created_at, timezone('utc', now()));

ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_lead_display_names()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $sync$
DECLARE
  derived_name text;
BEGIN
  derived_name := NULLIF(BTRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), '');

  IF TG_OP = 'INSERT' THEN
    NEW.full_name := COALESCE(NULLIF(BTRIM(NEW.full_name), ''), derived_name);
    NEW.client_name := COALESCE(NULLIF(BTRIM(NEW.client_name), ''), derived_name);
  ELSIF NEW.first_name IS DISTINCT FROM OLD.first_name
     OR NEW.last_name IS DISTINCT FROM OLD.last_name THEN
    IF NEW.full_name IS NULL OR NEW.full_name IS NOT DISTINCT FROM OLD.full_name THEN
      NEW.full_name := derived_name;
    END IF;
    IF NEW.client_name IS NULL OR NEW.client_name IS NOT DISTINCT FROM OLD.client_name THEN
      NEW.client_name := derived_name;
    END IF;
  END IF;

  RETURN NEW;
END;
$sync$;

DROP TRIGGER IF EXISTS leads_sync_display_names ON public.leads;
CREATE TRIGGER leads_sync_display_names
BEFORE INSERT OR UPDATE OF first_name, last_name, full_name, client_name ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.sync_lead_display_names();

DROP TRIGGER IF EXISTS leads_set_updated_at ON public.leads;
CREATE TRIGGER leads_set_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS deals_set_updated_at ON public.deals;
CREATE TRIGGER deals_set_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- The service request lifecycle is independent of the lead lifecycle. All reads
-- and writes are made by authenticated server routes using the service role.
CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  service text NOT NULL CHECK (service IN ('energy', 'insurance', 'web')),
  service_type text,
  reason text,
  description text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation',
                      'won', 'lost', 'changed_mind', 'not_interested', 'nurture', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  owner text,
  source text,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  next_action text,
  lost_reason text,
  closed_reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service role manages service_requests" ON public.service_requests;
CREATE POLICY "service role manages service_requests"
  ON public.service_requests FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS service_requests_lead_idx
  ON public.service_requests(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS service_requests_status_idx
  ON public.service_requests(status, priority, created_at DESC);

DROP TRIGGER IF EXISTS service_requests_set_updated_at ON public.service_requests;
CREATE TRIGGER service_requests_set_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Private settings can contain bank details and webhook secrets. This repair is
-- intentionally repeated here so an older settings script cannot leave the
-- row readable by anonymous website visitors.
DROP POLICY IF EXISTS "Public read system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Anon full access on system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Service role write system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Service role manages system_settings" ON public.system_settings;
CREATE POLICY "Service role manages system_settings"
  ON public.system_settings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Ensure all CRM-only agent tables remain inaccessible to anon/authenticated.
DROP POLICY IF EXISTS "insert audit" ON public.agent_audit;
DROP POLICY IF EXISTS "admin read own org audit" ON public.agent_audit;
DROP POLICY IF EXISTS "service role manages agent audit" ON public.agent_audit;
CREATE POLICY "service role manages agent audit"
  ON public.agent_audit FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin read own org approvals" ON public.agent_action_approvals;
DROP POLICY IF EXISTS "service role insert approvals" ON public.agent_action_approvals;
DROP POLICY IF EXISTS "service role update approvals" ON public.agent_action_approvals;
DROP POLICY IF EXISTS "service role manages approvals" ON public.agent_action_approvals;
CREATE POLICY "service role manages approvals"
  ON public.agent_action_approvals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- The security model uses server-side routes for database access. The public
-- anon key must not receive direct read/write grants on these tables.
REVOKE ALL ON public.leads, public.site_leads, public.deals, public.calendar_events,
  public.communications, public.invoices, public.activity_log, public.knowledge_base,
  public.service_requests, public.system_settings, public.notifications,
  public.agent_audit, public.agent_action_approvals, public.integration_credentials
FROM anon, authenticated;

GRANT ALL ON public.leads, public.site_leads, public.deals, public.calendar_events,
  public.communications, public.invoices, public.activity_log, public.knowledge_base,
  public.service_requests, public.system_settings, public.notifications,
  public.agent_audit, public.agent_action_approvals, public.integration_credentials
TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

REVOKE EXECUTE ON FUNCTION public.match_knowledge(vector, text, double precision, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_knowledge(vector, text, double precision, integer)
  TO service_role;

-- Verification after applying:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
-- SELECT policyname, roles, cmd FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;
