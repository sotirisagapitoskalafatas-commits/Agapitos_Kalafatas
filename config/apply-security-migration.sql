-- ============================================================
-- AGAPITOS KALAFATAS — SECURITY + SCHEMA MIGRATION (single run)
-- Paste the ENTIRE block once into the Supabase SQL Editor and run.
-- It is idempotent: it can be re-run safely (DROP IF EXISTS + IF NOT EXISTS).
--
-- What it does:
--   1) Migrates `leads` to the unified CRM schema (adds first_name/email/...,
--      maps old client_name rows) and locks it to service-role only.
--   2) CREATES any missing CRM tables (deals, calendar_events, communications,
--      invoices, activity_log, notifications, agent_sessions, chat_messages,
--      knowledge_base) so the app's service-role queries never hit
--      "relation does not exist".
--   3) Locks down RLS on ALL of those tables to service-role only (this overrides
--      the older, insecure RUN_ALL_SETUP policies that allowed public/anonymous
--      read/write of PII).
--   4) Makes client_documents + client_uploads storage buckets private and
--      service-role only.
-- ============================================================

-- 0. EXTENSIONS ------------------------------------------------
create extension if not exists vector;

-- ============================================================
-- 1. LEADS — migrate schema + secure RLS
-- ============================================================

-- Add unified columns (no-op if already present)
alter table public.leads add column if not exists first_name text;
alter table public.leads add column if not exists last_name text default '';
alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists phone text;
alter table public.leads add column if not exists property_type text;
alter table public.leads add column if not exists region text;
alter table public.leads add column if not exists service_category text default 'Ρεύμα';
alter table public.leads add column if not exists comments text;
alter table public.leads add column if not exists attached_files jsonb default '[]'::jsonb;
alter table public.leads add column if not exists gdpr_consent boolean default false;
alter table public.leads add column if not exists notes text default '';
alter table public.leads add column if not exists full_name text;
alter table public.leads add column if not exists company text;
alter table public.leads add column if not exists source text default 'website';
alter table public.leads add column if not exists tags text[] default '{}';
alter table public.leads add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Map legacy simple-schema rows into the unified columns (safe, no-op for new rows)
update public.leads
   set first_name = coalesce(first_name, client_name),
       phone      = coalesce(phone, client_contact),
       comments   = coalesce(comments, project_details)
 where client_name is not null;

-- Map legacy status values into the unified status set
update public.leads set status = 'contacted' where lower(status) = 'new' or status = 'Contacted';
update public.leads set status = 'customer'  where status = 'In Progress' or lower(status) = 'qualified' or lower(status) = 'won';
update public.leads set status = 'archived'  where lower(status) = 'lost';

-- Drop the old status check constraint so the unified one can be applied
do $$
declare
  cons text;
begin
  select conname into cons
    from pg_constraint c
    join pg_class r on r.oid = c.conrelid
    join pg_namespace n on n.oid = r.relnamespace
   where n.nspname = 'public' and r.relname = 'leads' and c.contype = 'c'
     and pg_get_constraintdef(c.oid) ilike '%status%'
   limit 1;
  if cons is not null then
    execute format('alter table public.leads drop constraint %I', cons);
  end if;
end $$;

-- Enforce unified NOT NULL defaults for required fields
update public.leads set first_name = coalesce(nullif(first_name,''), 'Unknown') where first_name is null or first_name = '';
update public.leads set phone = coalesce(phone,'') where phone is null;
update public.leads set service_category = coalesce(nullif(service_category,''), 'Ρεύμα');

alter table public.leads alter column first_name set not null;
alter table public.leads alter column last_name set default '';
alter table public.leads alter column service_category set default 'Ρεύμα';

-- Indexes for the unified table
create index if not exists leads_email_idx on public.leads(email);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_service_idx on public.leads(service_category);
create index if not exists leads_created_idx on public.leads(created_at desc);

-- updated_at trigger
create or replace function update_updated_at() returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end $$ language plpgsql;
drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
  for each row execute function update_updated_at();

-- Secure RLS on leads (service role only — anon fully locked out)
alter table public.leads enable row level security;
drop policy if exists "Allow public insert on leads" on public.leads;
drop policy if exists "Allow public insert" on public.leads;
drop policy if exists "Allow authenticated read on leads" on public.leads;
drop policy if exists "Allow authenticated update on leads" on public.leads;
drop policy if exists "Allow read on leads" on public.leads;
drop policy if exists "Allow update on leads" on public.leads;
drop policy if exists "Allow delete on leads" on public.leads;
drop policy if exists "Admin full access on leads" on public.leads;
drop policy if exists "Service role full access on leads" on public.leads;
create policy "Service role full access on leads"
  on public.leads for all
  to service_role
  using (true) with check (true);

-- ============================================================
-- 2. KNOWLEDGE BASE (RAG) — create + secure
--    The app writes/reads knowledge_base via the server-side
--    service role (supabase.rpc match_knowledge + direct selects).
-- ============================================================
create table if not exists public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  embedding vector(1536),
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create or replace function public.match_knowledge(
  query_embedding vector(1536),
  match_category text,
  match_threshold float,
  match_count int
)
returns table (id uuid, category text, title text, content text, similarity float)
language plpgsql
as $$
begin
  return query
  select
    kb.id, kb.category, kb.title, kb.content,
    1 - (kb.embedding <=> query_embedding) as similarity
  from public.knowledge_base kb
  where (match_category = 'all' or kb.category = match_category)
    and kb.embedding is not null
    and 1 - (kb.embedding <=> query_embedding) > match_threshold
  order by kb.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Drop the legacy, unused knowledge_vectors table if a previous (older) run of
-- this script created it. The app only uses knowledge_base for RAG.
drop table if exists public.knowledge_vectors;

create index if not exists knowledge_base_embedding_idx
  on public.knowledge_base using ivfflat (embedding vector_cosine_ops) with (lists = 10);

alter table public.knowledge_base enable row level security;
drop policy if exists "Admin full access on knowledge_base" on public.knowledge_base;
drop policy if exists "Allow service role full access" on public.knowledge_base;
drop policy if exists "Service role full access on knowledge_base" on public.knowledge_base;
create policy "Service role full access on knowledge_base"
  on public.knowledge_base for all
  to service_role using (true) with check (true);

-- ============================================================
-- 3. DEALS (pipeline) — create + secure
-- ============================================================
create table if not exists public.deals (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  value numeric default 0,
  currency text default 'EUR',
  stage text default 'lead' check (stage in ('lead','qualified','proposal','negotiation','closed_won','closed_lost')),
  assigned_to text default 'agapitos',
  expected_close_date date,
  closed_at timestamp with time zone,
  notes text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists deals_stage_idx on public.deals(stage);
create index if not exists deals_lead_idx on public.deals(lead_id);

alter table public.deals enable row level security;
drop policy if exists "Allow full access on deals" on public.deals;
drop policy if exists "Admin full access on deals" on public.deals;
drop policy if exists "Service role full access on deals" on public.deals;
create policy "Service role full access on deals"
  on public.deals for all to service_role using (true) with check (true);

-- ============================================================
-- 4. CALENDAR EVENTS — create + secure
-- ============================================================
create table if not exists public.calendar_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default '',
  event_type text default 'meeting' check (event_type in ('meeting','call','task','reminder','deadline')),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  all_day boolean default false,
  lead_id uuid references public.leads(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  location text default '',
  color text default '#6366f1',
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists events_starts_idx on public.calendar_events(start_time);

alter table public.calendar_events enable row level security;
drop policy if exists "Allow full access on calendar_events" on public.calendar_events;
drop policy if exists "Admin full access on calendar_events" on public.calendar_events;
drop policy if exists "Service role full access on calendar_events" on public.calendar_events;
create policy "Service role full access on calendar_events"
  on public.calendar_events for all to service_role using (true) with check (true);

-- ============================================================
-- 5. COMMUNICATIONS — create + secure
-- ============================================================
create table if not exists public.communications (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references public.leads(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  comm_type text default 'email' check (comm_type in ('email','phone','sms','whatsapp','meeting','note')),
  direction text default 'outbound' check (direction in ('inbound','outbound')),
  subject text default '',
  body text default '',
  contact_email text,
  contact_phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists communications_lead_idx on public.communications(lead_id);
create index if not exists communications_created_idx on public.communications(created_at desc);

alter table public.communications enable row level security;
drop policy if exists "Allow full access on communications" on public.communications;
drop policy if exists "Admin full access on communications" on public.communications;
drop policy if exists "Service role full access on communications" on public.communications;
create policy "Service role full access on communications"
  on public.communications for all to service_role using (true) with check (true);

-- ============================================================
-- 6. INVOICES — create + secure
-- ============================================================
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references public.leads(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  invoice_number text unique not null,
  type text default 'quote' check (type in ('quote','invoice','proforma')),
  status text default 'draft' check (status in ('draft','sent','accepted','rejected','paid','expired')),
  subtotal numeric default 0,
  tax_rate numeric default 24,
  tax_amount numeric default 0,
  total numeric default 0,
  currency text default 'EUR',
  items jsonb default '[]'::jsonb,
  notes text default '',
  valid_until date,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_number_idx on public.invoices(invoice_number);

alter table public.invoices enable row level security;
drop policy if exists "Allow full access on invoices" on public.invoices;
drop policy if exists "Admin full access on invoices" on public.invoices;
drop policy if exists "Service role full access on invoices" on public.invoices;
create policy "Service role full access on invoices"
  on public.invoices for all to service_role using (true) with check (true);

-- ============================================================
-- 7. ACTIVITY LOG (analytics) — create + secure
-- ============================================================
create table if not exists public.activity_log (
  id uuid default gen_random_uuid() primary key,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists activity_created_idx on public.activity_log(created_at desc);
create index if not exists activity_entity_idx on public.activity_log(entity_type, entity_id);

alter table public.activity_log enable row level security;
drop policy if exists "Allow full access on activity_log" on public.activity_log;
drop policy if exists "Service role full access on activity_log" on public.activity_log;
create policy "Service role full access on activity_log"
  on public.activity_log for all to service_role using (true) with check (true);

-- ============================================================
-- 8. NOTIFICATIONS — create + secure (service role only)
-- ============================================================
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  type text not null,
  status text not null,
  message text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
drop index if exists idx_notifications_created_at;
create index idx_notifications_created_at on public.notifications (created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "Service role full access on notifications" on public.notifications;
drop policy if exists "Anon can read notifications" on public.notifications;
drop policy if exists "Anon can insert notifications" on public.notifications;
drop policy if exists "Admin full access on notifications" on public.notifications;
create policy "Service role full access on notifications"
  on public.notifications for all
  to service_role using (true) with check (true);

-- ============================================================
-- 9. SYSTEM_SETTINGS — public read OK, writes locked down
-- ============================================================
alter table public.system_settings enable row level security;
insert into public.system_settings (id) values ('default') on conflict (id) do nothing;
drop policy if exists "Anon full access on system_settings" on public.system_settings;
drop policy if exists "Public read system_settings" on public.system_settings;
drop policy if exists "Service role write system_settings" on public.system_settings;
create policy "Public read system_settings"
  on public.system_settings for select using (true);
create policy "Service role write system_settings"
  on public.system_settings for all
  to service_role using (true) with check (true);

-- ============================================================
-- 10. AGENT CHAT TABLES — create + secure (service role only)
-- ============================================================
create table if not exists public.agent_sessions (
  id uuid default gen_random_uuid() primary key,
  name text not null default 'New Session',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  status text default 'active' check (status in ('active','inactive'))
);
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.agent_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);

alter table public.agent_sessions enable row level security;
alter table public.chat_messages enable row level security;
drop policy if exists "Allow all for anon" on public.agent_sessions;
drop policy if exists "Allow all for anon" on public.chat_messages;
drop policy if exists "Service role all on agent_sessions" on public.agent_sessions;
drop policy if exists "Service role all on chat_messages" on public.chat_messages;
create policy "Service role all on agent_sessions"
  on public.agent_sessions for all to service_role using (true) with check (true);
create policy "Service role all on chat_messages"
  on public.chat_messages for all to service_role using (true) with check (true);

-- ============================================================
-- 11. AGENT ACTION APPROVALS — service role only for
--     insert/update (keep existing read policy, does not expose to anon)
-- ============================================================
alter table public.agent_action_approvals enable row level security;
drop policy if exists "insert approvals" on public.agent_action_approvals;
drop policy if exists "update approvals" on public.agent_action_approvals;
drop policy if exists "service role insert approvals" on public.agent_action_approvals;
drop policy if exists "service role update approvals" on public.agent_action_approvals;
create policy "service role insert approvals"
  on public.agent_action_approvals for insert
  to service_role with check (true);
create policy "service role update approvals"
  on public.agent_action_approvals for update
  to service_role using (true) with check (true);

-- ============================================================
-- 12. STORAGE — buckets private + service role only
-- ============================================================
insert into storage.buckets (id, name, public)
values ('client_documents', 'client_documents', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('client_uploads', 'client_uploads', false)
on conflict (id) do update set public = false;

-- Remove the old wide-open anonymous policies on storage.objects
drop policy if exists "Allow public file uploads" on storage.objects;
drop policy if exists "Allow public file view" on storage.objects;
drop policy if exists "Allow uploads" on storage.objects;
drop policy if exists "Allow reads" on storage.objects;
drop policy if exists "Allow deletes" on storage.objects;
drop policy if exists "Service role upload documents" on storage.objects;
drop policy if exists "Service role read documents" on storage.objects;
drop policy if exists "Service role delete documents" on storage.objects;

create policy "Service role upload documents"
  on storage.objects for insert to service_role
  with check (bucket_id in ('client_documents','client_uploads'));
create policy "Service role read documents"
  on storage.objects for select to service_role
  using (bucket_id in ('client_documents','client_uploads'));
create policy "Service role delete documents"
  on storage.objects for delete to service_role
  using (bucket_id in ('client_documents','client_uploads'));

-- ============================================================
-- DONE. The single, idempotent migration has been applied.
-- ============================================================
