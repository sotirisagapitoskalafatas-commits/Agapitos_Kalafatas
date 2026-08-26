-- Unified CRM Schema for Agapitos Kalafatas
-- Run this in Supabase SQL Editor

-- 1. Drop old leads table if exists (or rename to leads_backup)
-- DROP TABLE IF EXISTS leads;

-- 2. Create the expanded Leads Table
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

-- 3. Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert (contact form)
DROP POLICY IF EXISTS "Allow public insert on leads" ON leads;
CREATE POLICY "Allow public insert on leads" ON leads
  FOR INSERT WITH CHECK (true);

-- Policy: Allow read for admin (service role)
DROP POLICY IF EXISTS "Allow read on leads" ON leads;
CREATE POLICY "Allow read on leads" ON leads
  FOR SELECT USING (true);

-- Policy: Allow update for admin
DROP POLICY IF EXISTS "Allow update on leads" ON leads;
CREATE POLICY "Allow update on leads" ON leads
  FOR UPDATE USING (true);

-- Policy: Allow delete for admin
DROP POLICY IF EXISTS "Allow delete on leads" ON leads;
CREATE POLICY "Allow delete on leads" ON leads
  FOR DELETE USING (true);

-- 4. Create Storage Bucket for Uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('client_uploads', 'client_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow public upload
DROP POLICY IF EXISTS "Allow public file uploads" ON storage.objects;
CREATE POLICY "Allow public file uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client_uploads');

-- Storage Policy: Allow public read/download
DROP POLICY IF EXISTS "Allow public file view" ON storage.objects;
CREATE POLICY "Allow public file view" ON storage.objects
  FOR SELECT USING (bucket_id = 'client_uploads');

-- 5. Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_service ON leads(service_category);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
