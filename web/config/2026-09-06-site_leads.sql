-- =============================================================================
-- MIGRATION: create site_leads (production-safe, minimal)
-- Apply this in Supabase → SQL Editor. Idempotent; safe to run once.
--
-- This is the ONLY missing piece on the live DB. It does NOT touch any other
-- table, policy, or the storage bucket — apply this rather than the full
-- schema.sql so nothing else changes on production.
--
-- Columns match exactly what /api/site-leads POST inserts.
-- =============================================================================

CREATE TABLE IF NOT EXISTS site_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  site_id TEXT NOT NULL,
  site_name TEXT DEFAULT '',
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'New'
);

ALTER TABLE site_leads ENABLE ROW LEVEL SECURITY;

-- Remove any legacy open policies if they exist, then lock to service_role.
DROP POLICY IF EXISTS "Allow public insert on site_leads" ON site_leads;
DROP POLICY IF EXISTS "Allow read on site_leads"          ON site_leads;
DROP POLICY IF EXISTS "Service role manages site_leads"   ON site_leads;

CREATE POLICY "Service role manages site_leads" ON site_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_site_leads_status  ON site_leads(status);
CREATE INDEX IF NOT EXISTS idx_site_leads_created ON site_leads(created_at DESC);

-- Verify:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'site_leads';
--   SELECT rowsecurity FROM pg_tables WHERE tablename = 'site_leads';  -- must be t
