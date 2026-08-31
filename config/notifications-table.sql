-- Notifications table for CRM webhook alerts
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,          -- 'slack', 'email', 'system'
  status TEXT NOT NULL,        -- 'sent', 'failed', 'skipped'
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast recent queries
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admin reads notifications via the authenticated /api/crm/notifications endpoint
-- and webhooks log via the server-side service role. The anon key is locked out.
CREATE POLICY "Service role full access on notifications"
  ON notifications FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
