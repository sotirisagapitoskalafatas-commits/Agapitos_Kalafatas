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

CREATE POLICY "Anon full access on system_settings"
  ON system_settings FOR ALL
  USING (true) WITH CHECK (true);
