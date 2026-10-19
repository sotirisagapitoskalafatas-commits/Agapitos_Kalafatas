-- =============================================================================
-- 2026-10-19 — fresh project security hardening
--
-- CRM/API routes use the server-side service role after their own auth checks.
-- No browser client should read private CRM tables directly.
-- =============================================================================

-- Keep pgvector outside the exposed public schema when the installed extension is still there.
CREATE SCHEMA IF NOT EXISTS extensions;
DO $move_vector$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'vector' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'ALTER EXTENSION vector SET SCHEMA extensions';
  END IF;
END;
$move_vector$;

-- Explicit service-role policies for tables created in the later feature slices.
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_asset_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_rule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages consent_log" ON public.consent_log;
CREATE POLICY "service role manages consent_log"
  ON public.consent_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages renewal_reminders" ON public.renewal_reminders;
CREATE POLICY "service role manages renewal_reminders"
  ON public.renewal_reminders FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages social_connections" ON public.social_connections;
CREATE POLICY "service role manages social_connections"
  ON public.social_connections FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages creative_campaigns" ON public.creative_campaigns;
CREATE POLICY "service role manages creative_campaigns"
  ON public.creative_campaigns FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages creative_assets" ON public.creative_assets;
CREATE POLICY "service role manages creative_assets"
  ON public.creative_assets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages creative_asset_variants" ON public.creative_asset_variants;
CREATE POLICY "service role manages creative_asset_variants"
  ON public.creative_asset_variants FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages creative_runs" ON public.creative_runs;
CREATE POLICY "service role manages creative_runs"
  ON public.creative_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages brand_rule" ON public.brand_rule;
CREATE POLICY "service role manages brand_rule"
  ON public.brand_rule FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- This app uses server routes with requireAuth + service-role DB clients.
-- Revoke direct Data API table access from browser roles across the public schema,
-- including newly added feature tables. The service role retains required access.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Lock down the security-definer event-trigger function: it is executed by the
-- database event trigger, not called by clients as an RPC.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- The embedding search function should only be callable by server-side code.
-- Pin search_path to prevent object shadowing and preserve invoker/RLS semantics.
CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding extensions.vector,
  match_category text,
  match_threshold double precision,
  match_count integer
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content text,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $match$
BEGIN
  RETURN QUERY
  SELECT kb.id, kb.category, kb.title, kb.content,
         1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE (match_category = 'all' OR kb.category = match_category)
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$match$;

REVOKE ALL ON FUNCTION public.match_knowledge(extensions.vector, text, double precision, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_knowledge(vector, text, double precision, integer)
  TO service_role;

-- Keep customer documents private. Public reads remain intentionally enabled
-- only for creative-assets, which contains web-preview media (not client files).
UPDATE storage.buckets SET public = false WHERE id IN ('client_uploads', 'client_documents');
