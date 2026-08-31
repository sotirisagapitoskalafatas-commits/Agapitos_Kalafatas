-- Leads table for CRM lead management
-- Run this in your Supabase SQL Editor

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_name text not null,
  client_contact text not null,
  project_details text,
  status text default 'New' check (status in ('New', 'Contacted', 'In Progress', 'Won', 'Lost'))
);

-- Enable Row Level Security (RLS)
alter table leads enable row level security;

-- CRITICAL: Lead data is sensitive (PII). The anon key must not be able to read,
-- update, or insert leads. All lead reads and writes flow through the server-side
-- API routes (/api/leads, /api/chat, /api/crm/leads) which use the service role
-- (service_role bypasses RLS). These policies therefore only grant access to the
-- service role, locking the anon key out of the leads table.
create policy "Service role full access on leads"
  on leads for all
  to service_role
  using (true) with check (true);
