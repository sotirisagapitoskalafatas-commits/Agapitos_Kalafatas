-- =============================================================================
-- MIGRATION: Lead "folder" upgrade (energy-provider fields, supplies, typed docs)
-- Apply in Supabase → SQL Editor. Idempotent; safe to run once on production.
--
-- ADDITIVE ONLY. This does NOT drop or rewrite any existing table, does NOT
-- touch existing RLS policies on other tables, and does NOT change the
-- client_uploads bucket. It only:
--   1. adds new nullable columns to `leads`
--   2. widens the `leads.status` CHECK to allow 'qualified' and 'lost'
--      (all existing values stay valid)
--   3. makes sure the `client_documents` storage bucket exists and is PRIVATE
--      (the CRM document vault already uses it; it just was never in schema.sql)
--
-- Existing 116 leads are untouched — every new column is nullable / defaulted.
-- =============================================================================


-- ---------------------------------------------------- 1. new lead columns ----
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company        TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address        TEXT;   -- Διεύθυνση
ALTER TABLE leads ADD COLUMN IF NOT EXISTS id_number      TEXT;   -- Α.Τ. (ταυτότητα)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS provider       TEXT;   -- Πάροχος
ALTER TABLE leads ADD COLUMN IF NOT EXISTS program        TEXT;   -- Πρόγραμμα
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source         TEXT;   -- Πηγή
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type      TEXT;   -- Τύπος (Οικιακό/Επαγγελματικό)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS partner        TEXT;   -- Συνεργάτης
ALTER TABLE leads ADD COLUMN IF NOT EXISTS partner_notes  TEXT;   -- Σημειώσεις συνεργάτη
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_agent TEXT;   -- Ανάθεση σε AI agent
ALTER TABLE leads ADD COLUMN IF NOT EXISTS renewal_date   DATE;   -- Ημ. ανανέωσης συμβολαίου
ALTER TABLE leads ADD COLUMN IF NOT EXISTS supplies       JSONB DEFAULT '[]'::jsonb;  -- Αριθμοί Παροχής ΔΕΔΔΗΕ


-- ----------------------------------------------- 2. widen status CHECK --------
-- The old constraint only allowed new_lead / contacted / customer / archived.
-- We add 'qualified' and 'lost' so the CRM can use the full Greek pipeline
-- (Νέα / Επικοινωνήθηκε / Qualified / Μετατράπηκε / Χαμένα / Διαγραμμένα).
-- Dropping by known name if present, then re-adding the widened set.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new_lead', 'contacted', 'qualified', 'customer', 'lost', 'archived'));

CREATE INDEX IF NOT EXISTS idx_leads_provider ON leads(provider);
CREATE INDEX IF NOT EXISTS idx_leads_source   ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_renewal  ON leads(renewal_date);


-- --------------------------------- 3. client_documents bucket (PRIVATE) -------
-- The lead document vault (/api/documents) reads/writes this bucket. It exists
-- on the live project already; this makes it explicit + guarantees it is
-- private (signed URLs only), matching client_uploads.
INSERT INTO storage.buckets (id, name, public)
VALUES ('client_documents', 'client_documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Service role manages client_documents" ON storage.objects;
CREATE POLICY "Service role manages client_documents" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'client_documents')
  WITH CHECK (bucket_id = 'client_documents');


-- ------------------------------------------------------------- verify ---------
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'leads' ORDER BY ordinal_position;
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--     WHERE conrelid = 'leads'::regclass AND contype = 'c';
--   SELECT id, public FROM storage.buckets WHERE id = 'client_documents'; -- public must be f
-- =============================================================================
