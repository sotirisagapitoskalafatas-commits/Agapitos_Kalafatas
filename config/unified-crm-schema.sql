-- ============================================================
-- UNIFIED CRM SCHEMA + VECTOR RAG
-- Run in Supabase SQL Editor to initialize all CRM tables,
-- vector search, and RLS policies.
-- ============================================================

-- 1. Enable required extensions
create extension if not exists vector;

-- 2. Core Leads Table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  company text,
  status text default 'NEW' check (status in ('NEW','CONTACTED','QUALIFIED','PROPOSAL','WON','LOST')),
  source text default 'website',
  notes text,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Vector Knowledge Base for RAG
create table if not exists public.knowledge_vectors (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  content text not null,
  category text default 'general',
  embedding vector(1536)
);

-- 4. Knowledge Base (non-vector, for simple search)
create table if not exists public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Deals / Pipeline
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  title text not null,
  value numeric(12,2) default 0,
  currency text default 'EUR',
  stage text default 'lead' check (stage in ('lead','qualified','proposal','negotiation','won','lost')),
  probability integer default 20 check (probability between 0 and 100),
  expected_close date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Calendar Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  title text not null,
  description text,
  event_type text default 'meeting' check (event_type in ('meeting','call','follow_up','deadline','other')),
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Communications Log
create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  direction text default 'outbound' check (direction in ('inbound','outbound')),
  channel text default 'email' check (channel in ('email','phone','sms','whatsapp','linkedin','other')),
  subject text,
  body text,
  sent_at timestamp with time zone default timezone('utc'::text, now())
);

-- 8. Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  invoice_number text unique not null,
  amount numeric(12,2) not null,
  currency text default 'EUR',
  status text default 'draft' check (status in ('draft','sent','paid','overdue','cancelled')),
  issued_at date default current_date,
  due_at date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 9. Indexes for vector search
create index if not exists knowledge_vectors_embedding_idx
  on public.knowledge_vectors using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists leads_email_idx on public.leads(email);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists deals_stage_idx on public.deals(stage);
create index if not exists events_starts_idx on public.events(starts_at);
create index if not exists communications_lead_idx on public.communications(lead_id);
create index if not exists invoices_status_idx on public.invoices(status);

-- 10. Vector similarity search function
create or replace function match_knowledge(
  query_embedding vector(1536),
  match_category text default 'all',
  match_threshold float default 0.4,
  match_count int default 3
)
returns table (
  id uuid,
  category text,
  title text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    1 - (kv.embedding <=> query_embedding) as similarity
  from knowledge_vectors kv
  join knowledge_base kb on kb.id = kv.id
  where
    (match_category = 'all' or kb.category = match_category)
    and 1 - (kv.embedding <=> query_embedding) > match_threshold
  order by kv.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 11. Row Level Security
-- CRITICAL: All CRM data (leads, deals, events, communications, invoices) is
-- sensitive / PII and MUST NOT be readable or writable with the anon key.
-- Admin access flows through the authenticated Next.js /api/crm/* endpoints,
-- which use the Supabase service role (service_role bypasses RLS). The policies
-- below therefore GRANT access to service_role only, effectively locking the
-- anon key out of all CRM data.
alter table public.leads enable row level security;
alter table public.knowledge_vectors enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.deals enable row level security;
alter table public.events enable row level security;
alter table public.communications enable row level security;
alter table public.invoices enable row level security;

-- Leads: service role only (no anon access)
create policy "Service role full access on leads"
  on public.leads for all
  to service_role
  using (true) with check (true);

-- Knowledge vectors: service role only (RAG runs server-side)
create policy "Service role full access on knowledge_vectors"
  on public.knowledge_vectors for all
  to service_role
  using (true) with check (true);

-- Knowledge base: service role only (RAG runs server-side; anon never reads it)
create policy "Service role full access on knowledge_base"
  on public.knowledge_base for all
  to service_role
  using (true) with check (true);

-- Deals / pipeline: service role only
create policy "Service role full access on deals"
  on public.deals for all
  to service_role
  using (true) with check (true);

-- Events: service role only
create policy "Service role full access on events"
  on public.events for all
  to service_role
  using (true) with check (true);

-- Communications: service role only
create policy "Service role full access on communications"
  on public.communications for all
  to service_role
  using (true) with check (true);

-- Invoices: service role only (financial data)
create policy "Service role full access on invoices"
  on public.invoices for all
  to service_role
  using (true) with check (true);

-- 12. Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on public.leads
  for each row execute function update_updated_at();

create trigger deals_updated_at
  before update on public.deals
  for each row execute function update_updated_at();
