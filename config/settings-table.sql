CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL DEFAULT '',
  vat_number TEXT NOT NULL DEFAULT '',
  tax_office TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  bank_iban TEXT NOT NULL DEFAULT '',
  slack_webhook_url TEXT NOT NULL DEFAULT '',
  notify_email TEXT NOT NULL DEFAULT '',
  ga_measurement_id TEXT NOT NULL DEFAULT '',
  supabase_webhook_secret TEXT NOT NULL DEFAULT '',
  ai_system_prompt TEXT NOT NULL DEFAULT '',
  pipeline_stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO system_settings (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- system_settings contains private values (bank details, webhook secrets and AI prompts).
-- The public website must access any deliberately public settings through a
-- separate allowlisted endpoint/view, never by exposing this whole row.
DROP POLICY IF EXISTS "Public read system_settings" ON system_settings;
DROP POLICY IF EXISTS "Service role write system_settings" ON system_settings;
CREATE POLICY "Service role manages system_settings"
  ON system_settings FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
