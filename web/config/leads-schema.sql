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

-- Policy: Allow public insert (for the chat widget to save leads)
create policy "Allow public insert on leads" on leads
  for insert with check (true);

-- Policy: Allow authenticated read (for admin dashboard)
create policy "Allow authenticated read on leads" on leads
  for select using (true);

-- Policy: Allow authenticated update (for admin status changes)
create policy "Allow authenticated update on leads" on leads
  for update using (true);
