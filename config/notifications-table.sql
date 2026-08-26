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

-- Service role can do everything
CREATE POLICY "Service role full access on notifications"
  ON notifications FOR ALL
  USING (auth.role() = 'service_role');

-- Anon can read (for CRM dashboard)
CREATE POLICY "Anon can read notifications"
  ON notifications FOR SELECT
  USING (true);

-- Anon can insert (for webhook logging)
CREATE POLICY "Anon can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);
