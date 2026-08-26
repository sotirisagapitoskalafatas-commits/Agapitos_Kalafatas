-- =============================================
-- COMBINED SETUP: Run in Supabase SQL Editor
-- Execute this single file to set up everything
-- =============================================

-- === PART 1: Unified CRM Schema ===

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

DROP POLICY IF EXISTS "Allow public insert on leads" ON leads;
CREATE POLICY "Allow public insert on leads" ON leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read on leads" ON leads;
CREATE POLICY "Allow read on leads" ON leads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update on leads" ON leads;
CREATE POLICY "Allow update on leads" ON leads
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete on leads" ON leads;
CREATE POLICY "Allow delete on leads" ON leads
  FOR DELETE USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('client_uploads', 'client_uploads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public file uploads" ON storage.objects;
CREATE POLICY "Allow public file uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client_uploads');

DROP POLICY IF EXISTS "Allow public file view" ON storage.objects;
CREATE POLICY "Allow public file view" ON storage.objects
  FOR SELECT USING (bucket_id = 'client_uploads');

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_service ON leads(service_category);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- === PART 2: RAG Vector Database ===

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(1536),
  match_category TEXT,
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE (match_category = 'all' OR kb.category = match_category)
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx
  ON knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON knowledge_base
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- === PART 3: Seed Knowledge Base ===

INSERT INTO knowledge_base (category, title, content) VALUES
('web_dev', 'E-shop Pricing & Packages', 'Τα custom E-shops ξεκινούν από €1400. Περιλαμβάνουν: πλήρη σχεδίαση UI/UX, WooCommerce/Next.js architecture, διασύνδεση με τράπεζες, γρήγορη φόρτωση (Core Web Vitals), SEO optimization, και εκπαίδευση διαχείρισης.'),
('web_dev', 'SaaS & Custom Web Development', 'Αναλαμβάνουμε την κατασκευή B2B SaaS πλατφορμών, εταιρικών ιστοσελίδων και custom web εφαρμογών. Stack: Next.js, React, TypeScript, PostgreSQL, Supabase, Stripe, Docker, AWS, Azure.'),
('web_dev', 'Website Management & Security', 'Υπηρεσίες διαχείρισης ιστοσελίδων: τακτικές αναβαθμίσεις, SSL, backup, monitoring, ασφάλεια (WAF, DDoS protection), performance optimization.'),
('web_dev', 'AI Agents & Neural Systems', 'Κατασκευή custom AI agents με αρχιτεκτονική Agentic RAG: multi-agent routing, vector databases, tool calling, voice integration.'),
('web_dev', 'UI/UX Design & Conversion Optimization', 'Custom σχεδίαση που βασίζεται στα data. A/B testing, heatmap analysis, conversion funnel optimization, responsive design, accessibility (WCAG).'),

('energy', 'Προγράμματα Ρεύματος & Αερίου', 'Δωρεάν σύγκριση και μετάβαση στα φθηνότερα προγράμματα ρεύματος και φυσικού αερίου. Εξοικονόμηση έως 40% στους λογαριασμούς ενέργειας.'),
('energy', 'Φωτοβολταϊκά & Αποθήκευση', 'Μελέτη, άδειες και εγκατάσταση φωτοβολταϊκών συστημάτων. Net Metering & Net Billing. Μπαταρίες αποθήκευσης ενέργειας. ROI analysis 5-7 ετών.'),
('energy', 'Ηλεκτροκίνηση & EV Charging', 'Πλήρεις υποδομές φόρτισης ηλεκτρικών οχημάτων. Home chargers (7-22kW), commercial DC fast chargers (50-150kW).'),
('energy', 'Εξοικονόμηση Ενέργειας & Audit', 'Ενεργειακό audit κτιρίων. LED αντικαταστάσεις, θερμομόνωση, smart HVAC systems. Μείωση κατανάλωσης έως 60%.'),
('energy', 'Ηλεκτρική Ενέργεια - Τιμές 2026', 'Τιμές ρεύματος €0.08-€0.18/kWh. Fixed rate προσφέρει σταθερότητα. Variable ακολουθεί την αγορά. Off-peak μειώνει κόστος 25%.'),

('insurance', 'Ασφάλεια Υγείας & Νοσοκομειακά', 'Ολοκληρωμένα προγράμματα πρωτοβάθμιας και δευτεροβάθμιας περίθαλψης. Ελεύθερη επιλογή νοσοκομείου. Πρόγραμμα 500€-3000€/χρόνο.'),
('insurance', 'Ασφάλειες Ζωής & Συνταξιοδοτικά', 'Προστασία οικογένειας: εξασφάλιση σπουδών, αποζημίωση απώλειας εισοδήματος. Αποταμιευτικά & συνταξιοδοτικά πλάνα.'),
('insurance', 'Ασφάλιση Οχημάτων', 'Πλήρη πακέτα αυτοκινήτων & μηχανών: Βασική, Πυρός/Κλοπής, Μικτή, Πλήρης. Fleet insurance, commercial vehicles.'),
('insurance', 'Ασφάλιση Ακινήτων & Επιχειρήσεων', 'Ασφάλιση κατοικιών (πυρός, σεισμός, πλημμύρα), εμπορικών κτιρίων. Business interruption insurance.'),
('insurance', 'Τιμές Ασφαλίσεων 2026', 'Υγεία: €50-€250/μήνα. Αυτοκίνητο: €300-€800/χρόνο. Ζωή: από €20/μήνα. Έκπτωση νέων πελατών έως 20%.');

-- === PART 4: Professional CRM Tables ===

-- Tasks / Deals
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
CREATE POLICY "Allow full access on deals" ON deals FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_lead ON deals(lead_id);

-- Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'call', 'task', 'reminder', 'deadline')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  location TEXT DEFAULT '',
  color TEXT DEFAULT '#6366f1',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access on calendar_events" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_events_start ON calendar_events(start_time);

-- Emails / Communications Log
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
CREATE POLICY "Allow full access on communications" ON communications FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_comm_lead ON communications(lead_id);
CREATE INDEX IF NOT EXISTS idx_comm_created ON communications(created_at DESC);

-- Quotes / Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'quote' CHECK (type IN ('quote', 'invoice', 'proforma')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'paid', 'expired')),
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 24,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  items JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  valid_until DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- Activity Log for Analytics
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access on activity_log" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);
