-- Supabase SQL Schema for Atlas AI Chat
-- Run this in the Supabase SQL Editor to set up chat persistence

-- Sessions table
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'New Session',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Row Level Security (RLS)
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat data is internal: only the service role (server-side agent) can access it.
-- The anon key is fully locked out of agent_sessions and chat_messages.
CREATE POLICY "Service role all on agent_sessions"
  ON agent_sessions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role all on chat_messages"
  ON chat_messages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
