-- ============================================================
-- AGAPITOS KALAFATAS — SECURITY + SCHEMA MIGRATION (single run)
-- Paste the ENTIRE block once into the Supabase SQL Editor and run.
-- It is idempotent: it can be re-run safely (DROP IF EXISTS + IF NOT EXISTS).
--
-- What it does:
--   1) Migrates `leads` to the unified CRM schema (adds first_name/email/...,
--      maps old client_name rows) and locks it to service-role only.
--   2) Tightens RLS on deals, events, communications, invoices, knowledge_*,
--      notifications, system_settings, chat_messages, agent_sessions,
--      agent_action_approvals.
--   3) Fixes the client_documents storage bucket to be private + service-role only.
-- ============================================================

-- 1. LEADS — migrate schema + secure RLS ------------------------
create extension if not exists vector;

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

-- 2. KNOWLEDGE TABLES -------------------------------------------
create table if not exists public.knowledge_vectors (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  content text not null,
  category text default 'general',
  embedding vector(1536)
);
create table if not exists public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.knowledge_vectors enable row level security;
alter table public.knowledge_base enable row level security;
drop policy if exists "Admin full access on knowledge_vectors" on public.knowledge_vectors;
drop policy if exists "Admin full access on knowledge_base" on public.knowledge_base;
drop policy if exists "Service role full access on knowledge_vectors" on public.knowledge_vectors;
drop policy if exists "Service role full access on knowledge_base" on public.knowledge_base;
create policy "Service role full access on knowledge_vectors"
  on public.knowledge_vectors for all
  to service_role using (true) with check (true);
create policy "Service role full access on knowledge_base"
  on public.knowledge_base for all
  to service_role using (true) with check (true);
create index if not exists knowledge_vectors_embedding_idx
  on public.knowledge_vectors using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- 3. DEALS / EVENTS / COMMUNICATIONS / INVOICES ------------------
alter table public.deals enable row level security;
alter table public.events enable row level security;
alter table public.communications enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "Admin full access on deals" on public.deals;
drop policy if exists "Admin full access on events" on public.events;
drop policy if exists "Admin full access on communications" on public.communications;
drop policy if exists "Admin full access on invoices" on public.invoices;
drop policy if exists "Service role full access on deals" on public.deals;
drop policy if exists "Service role full access on events" on public.events;
drop policy if exists "Service role full access on communications" on public.communications;
drop policy if exists "Service role full access on invoices" on public.invoices;

create policy "Service role full access on deals"
  on public.deals for all to service_role using (true) with check (true);
create policy "Service role full access on events"
  on public.events for all to service_role using (true) with check (true);
create policy "Service role full access on communications"
  on public.communications for all to service_role using (true) with check (true);
create policy "Service role full access on invoices"
  on public.invoices for all to service_role using (true) with check (true);

create index if not exists deals_stage_idx on public.deals(stage);
create index if not exists events_starts_idx on public.events(starts_at);
create index if not exists communications_lead_idx on public.communications(lead_id);
create index if not exists invoices_status_idx on public.invoices(status);

-- 4. NOTIFICATIONS ------------------------------------------------
alter table notifications enable row level security;
drop index if exists idx_notifications_created_at;
create index idx_notifications_created_at on notifications (created_at desc);
drop policy if exists "Service role full access on notifications" on notifications;
drop policy if exists "Anon can read notifications" on notifications;
drop policy if exists "Anon can insert notifications" on notifications;
create policy "Service role full access on notifications"
  on notifications for all
  to service_role
  using (true) with check (true);

-- 5. SYSTEM_SETTINGS (public read OK, writes locked down) ----------
alter table system_settings enable row level security;
insert into system_settings (id) values ('default') on conflict (id) do nothing;
drop policy if exists "Anon full access on system_settings" on system_settings;
drop policy if exists "Public read system_settings" on system_settings;
drop policy if exists "Service role write system_settings" on system_settings;
create policy "Public read system_settings"
  on system_settings for select using (true);
create policy "Service role write system_settings"
  on system_settings for all
  to service_role using (true) with check (true);

-- 6. AGENT CHAT TABLES (service role only) -------------------------
alter table agent_sessions enable row level security;
alter table chat_messages enable row level security;
drop policy if exists "Allow all for anon" on agent_sessions;
drop policy if exists "Allow all for anon" on chat_messages;
drop policy if exists "Service role all on agent_sessions" on agent_sessions;
drop policy if exists "Service role all on chat_messages" on chat_messages;
create policy "Service role all on agent_sessions"
  on agent_sessions for all to service_role using (true) with check (true);
create policy "Service role all on chat_messages"
  on chat_messages for all to service_role using (true) with check (true);

-- 7. AGENT ACTION APPROVALS (service role only for insert/update) --
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
-- keep the existing single-org read policy (does not expose to anon)

-- 8. CLIENT DOCUMENTS STORAGE (private + service role only) --------
insert into storage.buckets (id, name, public)
values ('client_documents', 'client_documents', false)
on conflict (id) do update set public = false;

drop policy if exists "Allow uploads" on storage.objects;
drop policy if exists "Allow reads" on storage.objects;
drop policy if exists "Allow deletes" on storage.objects;
drop policy if exists "Service role upload documents" on storage.objects;
drop policy if exists "Service role read documents" on storage.objects;
drop policy if exists "Service role delete documents" on storage.objects;
create policy "Service role upload documents"
  on storage.objects for insert to service_role
  with check (bucket_id = 'client_documents');
create policy "Service role read documents"
  on storage.objects for select to service_role
  using (bucket_id = 'client_documents');
create policy "Service role delete documents"
  on storage.objects for delete to service_role
  using (bucket_id = 'client_documents');

-- 9. VIEWS / VERIFY ------------------------------------------------
-- Quick sanity queries (read-only):
select tablename from pg_tables where schemaname='public' order by tablename;
