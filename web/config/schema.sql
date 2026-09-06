-- =============================================================================
-- HARDENED SCHEMA — Agapitos Kalafatas CRM
-- =============================================================================
--
-- This file is the *only* schema file that should be applied to a fresh Supabase
-- project. It supersedes the removed RUN_ALL_SETUP.sql and unified-crm-schema.sql
-- which contained OPEN policies ( `USING (true)` ) that let any anon visitor
-- read/update/delete every lead, deal, invoice, and file — the CRM's entire PII.
--
-- SECURITY MODEL
--   • RLS enabled on every table.
--   • Only the `service_role` key can read/write CRM data.
--   • The `anon` key (embedded in the browser bundle) has NO privileged access.
--   • Storage bucket `client_uploads` is PRIVATE — signed URLs required to view.
--   • All CRM-mutating server routes must run server-side with the service key.
--
-- WHY NO `USING (true)` FOR ANON/AUTHENTICATED
--   `USING (true)` on a PUBLIC-facing Supabase project means anyone with the
--   anon key (which is baked into the client bundle) can bypass every guard.
--   The application must gate CRM mutations behind server-side auth instead.
--
-- HOW TO APPLY
--   1. Open Supabase → SQL Editor
--   2. Paste this whole file
--   3. Run
--   4. Verify in Table Editor: RLS = enabled on every table
-- =============================================================================


-- ---------------------------------------------------------------- extensions --
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- --------------------------------------------------------------- leads table --
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT NOT NULL,
  property_type TEXT,
  region TEXT,
  service_category TEXT NOT NULL DEFAULT 'Ρεύμα',
  comments TEXT,
  attached_files JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'new_lead' CHECK (status IN ('new_lead', 'contacted', 'customer', 'archived')),
  gdpr_consent BOOLEAN DEFAULT false NOT NULL,
  notes TEXT DEFAULT ''
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages leads"  ON leads;
DROP POLICY IF EXISTS "Allow public insert on leads" ON leads;
DROP POLICY IF EXISTS "Allow read on leads"          ON leads;
DROP POLICY IF EXISTS "Allow update on leads"        ON leads;
DROP POLICY IF EXISTS "Allow delete on leads"        ON leads;

-- Only the server (using SERVICE_ROLE key) can touch leads. Public form
-- submissions go through /api/chat, /api/site-leads, /api/contact, etc.,
-- which run server-side with the service key.
CREATE POLICY "Service role manages leads" ON leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_service ON leads(service_category);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);


-- --------------------------------------------------------- site_leads table --
-- Captures leads from the Atlas Builder generated sites.
-- Columns mirror exactly what /api/site-leads POST inserts.
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

DROP POLICY IF EXISTS "Service role manages site_leads" ON site_leads;
CREATE POLICY "Service role manages site_leads" ON site_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_site_leads_status  ON site_leads(status);
CREATE INDEX IF NOT EXISTS idx_site_leads_created ON site_leads(created_at DESC);


-- --------------------------------------------- storage: client_uploads (PRIVATE) --
INSERT INTO storage.buckets (id, name, public)
VALUES ('client_uploads', 'client_uploads', false)  -- PRIVATE, signed URLs only
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Allow public file uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public file view"    ON storage.objects;
DROP POLICY IF EXISTS "Service role manages client_uploads" ON storage.objects;

CREATE POLICY "Service role manages client_uploads" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'client_uploads')
  WITH CHECK (bucket_id = 'client_uploads');


-- ----------------------------------------------------------- knowledge_base --
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Allow service role full access"       ON knowledge_base;

CREATE POLICY "Service role manages knowledge_base" ON knowledge_base
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx
  ON knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

-- Vector similarity search RPC used by RAG sub-agents.
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(1536),
  match_category  TEXT,
  match_threshold FLOAT,
  match_count     INT
)
RETURNS TABLE (id UUID, category TEXT, title TEXT, content TEXT, similarity FLOAT)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT kb.id, kb.category, kb.title, kb.content,
         1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE (match_category = 'all' OR kb.category = match_category)
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- ---------------------------------------------------------------- deals table --
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  assigned_to TEXT DEFAULT 'agapitos',
  expected_close_date DATE,
  closed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access on deals" ON deals;
DROP POLICY IF EXISTS "Service role manages deals"  ON deals;

CREATE POLICY "Service role manages deals" ON deals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_lead  ON deals(lead_id);


-- ------------------------------------------------------- calendar_events --
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'call', 'task', 'reminder', 'deadline')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time   TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  location TEXT DEFAULT '',
  color TEXT DEFAULT '#6366f1',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access on calendar_events"  ON calendar_events;
DROP POLICY IF EXISTS "Service role manages calendar_events"  ON calendar_events;

CREATE POLICY "Service role manages calendar_events" ON calendar_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_events_start ON calendar_events(start_time);


-- ------------------------------------------------------- communications --
CREATE TABLE IF NOT EXISTS communications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  comm_type TEXT DEFAULT 'email' CHECK (comm_type IN ('email', 'phone', 'sms', 'whatsapp', 'meeting', 'note')),
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT DEFAULT '',
  body TEXT DEFAULT '',
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access on communications" ON communications;
DROP POLICY IF EXISTS "Service role manages communications" ON communications;

CREATE POLICY "Service role manages communications" ON communications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_comm_lead    ON communications(lead_id);
CREATE INDEX IF NOT EXISTS idx_comm_created ON communications(created_at DESC);


-- ------------------------------------------------------------ invoices --
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  type   TEXT DEFAULT 'quote'  CHECK (type IN ('quote', 'invoice', 'proforma')),
  status TEXT DEFAULT 'draft'  CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'paid', 'expired')),
  subtotal   NUMERIC DEFAULT 0,
  tax_rate   NUMERIC DEFAULT 24,
  tax_amount NUMERIC DEFAULT 0,
  total      NUMERIC DEFAULT 0,
  currency   TEXT DEFAULT 'EUR',
  items      JSONB DEFAULT '[]'::jsonb,
  notes      TEXT DEFAULT '',
  valid_until DATE,
  paid_at    TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access on invoices" ON invoices;
DROP POLICY IF EXISTS "Service role manages invoices" ON invoices;

CREATE POLICY "Service role manages invoices" ON invoices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);


-- ------------------------------------------------------------ activity_log --
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  action      TEXT NOT NULL,
  details     JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access on activity_log" ON activity_log;
DROP POLICY IF EXISTS "Service role manages activity_log" ON activity_log;

CREATE POLICY "Service role manages activity_log" ON activity_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity  ON activity_log(entity_type, entity_id);


-- =============================================================================
-- VERIFICATION QUERIES (run these after applying)
-- =============================================================================
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'
--     AND tablename IN ('leads','site_leads','deals','calendar_events',
--                       'communications','invoices','activity_log','knowledge_base');
--   -- Every row must show rowsecurity = t.
--
--   SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
--     FROM pg_policies WHERE schemaname = 'public'
--     ORDER BY tablename, policyname;
--   -- Every policy must show roles = {service_role}.
--
-- To seed knowledge_base for the RAG agents, run seed_knowledge.sql after this file.
-- =============================================================================