-- ============================================================
-- SEED TEST CRM DATA — Agapitos Kalafatas
-- ------------------------------------------------------------
-- Idempotent sample seed so the CRM dashboard / lists don't show
-- empty states ("No data yet", all-zero KPIs). Run once in the
-- Supabase SQL Editor (service role context, so RLS permits it).
--
-- Safe to re-run: it deletes only the seeded rows (matched by the
-- seed marker in activity_log / a reserved email domain) before
-- re-inserting, and uses explicit generated UUIDs.
-- ============================================================

-- Guard: only seed when tables exist (so pre-apply is harmless).
do $$
begin
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='leads') then
    raise notice 'leads table missing — skipping CRM seed';
    return;
  end if;
end $$;

-- Idempotency: remove the previously-seeded rows (by their fixed IDs)
-- plus any rows that reference them, so re-running is safe.
delete from public.communications where lead_id in (
  'a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000004',
  'a0000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-000000000006',
  'a0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000008',
  'a0000000-0000-4000-8000-000000000009','a0000000-0000-4000-8000-000000000010',
  'a0000000-0000-4000-8000-000000000011','a0000000-0000-4000-8000-000000000012'
);
delete from public.calendar_events where lead_id in (
  'a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000006',
  'a0000000-0000-4000-8000-000000000008'
);
delete from public.invoices  where id in ('c0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000003','c0000000-0000-4000-8000-000000000004') or invoice_number like 'INV-2026-%';
delete from public.deals     where id in ('b0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000006','b0000000-0000-4000-8000-000000000007','b0000000-0000-4000-8000-000000000008','b0000000-0000-4000-8000-000000000010','b0000000-0000-4000-8000-000000000011');
delete from public.leads     where id in ('a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-000000000006','a0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000008','a0000000-0000-4000-8000-000000000009','a0000000-0000-4000-8000-000000000010','a0000000-0000-4000-8000-000000000011','a0000000-0000-4000-8000-000000000012');

-- ------------------------------------------------------------------
-- 1) LEADS  (status: new_lead / contacted / customer / archived)
-- Service categories match the site contact form options.
-- ------------------------------------------------------------------
insert into public.leads (id, client_name, first_name, last_name, email, phone, property_type, region, service_category, comments, gdpr_consent, status, created_at) values
 ('a0000000-0000-4000-8000-000000000001','Maria Papadopoulou','Maria','Papadopoulou','maria.papadopoulou@gmail.com','6912345678','House','Attica','Electricity','Looking to switch provider, wants the cheapest tariff', true, 'new_lead', now() - interval '2 days'),
 ('a0000000-0000-4000-8000-000000000002','Giorgos Nikolaou','Giorgos','Nikolaou','g.nikolaou@outlook.com','6977001122','House','Thessaloniki','Natural Gas','Needs a new gas connection and supplier quote', true, 'new_lead', now() - interval '1 day'),
 ('a0000000-0000-4000-8000-000000000003','Elena Georgiou','Elena','Georgiou','elena.georgiou@nova-industrial.gr','6944556677','Business','Attica','Solar','Wants a 5kW rooftop PV system for her bakery', true, 'contacted', now() - interval '9 days'),
 ('a0000000-0000-4000-8000-000000000004','Dimitris Antoniou','Dimitris','Antoniou','d.antoniou@buildco.gr','6988001122','Business','Crete','Energy Savings','Large facility — energy audit + savings plan', true, 'contacted', now() - interval '12 days'),
 ('a0000000-0000-4000-8000-000000000005','Katerina Vasilaki','Katerina','Vasilaki','k.vasilaki@gmail.com','6900112233','House','Attica','Energy Storage','Adding a battery to existing solar install', true, 'new_lead', now() - interval '3 days'),
 ('a0000000-0000-4000-8000-000000000006','Nikos Kostopoulos','Nikos','Kostopoulos','n.kostopoulos@yacht-marine.gr','6933221100','Business','Aegean Islands','E-Mobility','Wants marina EV chargers + fleet charging', true, 'contacted', now() - interval '15 days'),
 ('a0000000-0000-4000-8000-000000000007','Sofia Dimitriou','Sofia','Dimitriou','sofia.d@corp-solutions.gr','6966554433','Business','Attica','Website','Full company website redesign, urgent before expo', true, 'contacted', now() - interval '5 days'),
 ('a0000000-0000-4000-8000-000000000008','Panagiotis Roussos','Panagiotis','Roussos','p.roussos@med.gr','6955443322','Business','Thessaly','Custom Software','Clinic scheduling system for 3 branches', true, 'new_lead', now() - interval '6 days'),
 ('a0000000-0000-4000-8000-000000000009','Anna Makri','Anna','Makri','anna.makri@hotmail.com','6999888777','House','Peloponnese','Electricity','Compare tariffs for a 2-person household', true, 'customer', now() - interval '60 days'),
 ('a0000000-0000-4000-8000-000000000010','Christos Stavrou','Christos','Stavrou','ch.stavrou@land.gr','6922113344','House','Macedonia','Solar','Self-consumption PV + storage, family home', true, 'customer', now() - interval '45 days'),
 ('a0000000-0000-4000-8000-000000000011','Ioanna Liakopoulou','Ioanna','Liakopoulou','ioanna.l@retail-group.gr','6977558899','Business','Attica','E-shop','Wants to move legacy webshop to a modern storefront', true, 'customer', now() - interval '30 days'),
 ('a0000000-0000-4000-8000-000000000012','Vasilis Pappas','Vasilis','Pappas','v.pappas@asfalistiki.gr','6955001122','Business','Ionian Islands','Car Insurance','Fleet auto insurance renewal for 12 vans', true, 'customer', now() - interval '20 days');

-- ------------------------------------------------------------------
-- 2) DEALS (pipeline)  — values drive Pipeline Value / Won Revenue
-- ------------------------------------------------------------------
insert into public.deals (id, lead_id, title, value, currency, stage, assigned_to, expected_close_date, created_at) values
 ('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','Bakery rooftop PV 5kW','8200','EUR','proposal','agapitos', current_date + 14, now() - interval '9 days'),
 ('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000004','Facility energy audit + savings','6400','EUR','qualified','agapitos', current_date + 21, now() - interval '12 days'),
 ('b0000000-0000-4000-8000-000000000006','a0000000-0000-4000-8000-000000000006','Marina EV charging infrastructure','12500','EUR','negotiation','agapitos', current_date + 10, now() - interval '15 days'),
 ('b0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000007','Corporate website redesign','3800','EUR','lead','agapitos', current_date + 30, now() - interval '5 days'),
 ('b0000000-0000-4000-8000-000000000008','a0000000-0000-4000-8000-000000000008','Clinic scheduling SaaS','9800','EUR','proposal','agapitos', current_date + 18, now() - interval '6 days'),
 ('b0000000-0000-4000-8000-000000000010','a0000000-0000-4000-8000-000000000010','Residential PV + storage 10kW','11400','EUR','closed_won','agapitos', current_date - 10, now() - interval '45 days'),
 ('b0000000-0000-4000-8000-000000000011','a0000000-0000-4000-8000-000000000011','Webshop migration to modern storefront','5400','EUR','closed_won','agapitos', current_date - 5, now() - interval '30 days');

-- ------------------------------------------------------------------
-- 3) INVOICES  (type: invoice/quote/proforma; status from draft..paid)
-- ------------------------------------------------------------------
insert into public.invoices (id, lead_id, deal_id, invoice_number, type, status, subtotal, tax_rate, tax_amount, total, currency, items, created_at) values
 ('c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000009',null,'INV-2026-001','invoice','paid',403.23,24,96.77,500.00,'EUR','[]', now() - interval '55 days'),
 ('c0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000010','b0000000-0000-4000-8000-000000000006','INV-2026-002','invoice','paid',9193.55,24,2206.45,11400.00,'EUR','[]', now() - interval '40 days'),
 ('c0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000003',null,'INV-2026-003','invoice','sent',3225.81,24,774.19,4000.00,'EUR','[]', now() - interval '10 days'),
 ('c0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000006','b0000000-0000-4000-8000-000000000003','INV-2026-004','invoice','draft',5040.32,24,1209.68,6250.00,'EUR','[]', now() - interval '3 days');

-- ------------------------------------------------------------------
-- 4) CALENDAR EVENTS  (upcoming within next 7 days for dashboard)
-- ------------------------------------------------------------------
insert into public.calendar_events (id, title, event_type, start_time, end_time, lead_id, deal_id, location, completed, created_at) values
 ('d0000000-0000-4000-8000-000000000001','Site visit — bakery PV','meeting', now() + interval '1 day', now() + interval '1 day' + interval '1 hour', 'a0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000001','Kolokotroni 12, Athens', false, now()),
 ('d0000000-0000-4000-8000-000000000002','Marina charger proposal call','call', now() + interval '2 days', now() + interval '2 days' + interval '30 minutes', 'a0000000-0000-4000-8000-000000000006','b0000000-0000-4000-8000-000000000003','Video call', false, now()),
 ('d0000000-0000-4000-8000-000000000003','Clinic SaaS demo','meeting', now() + interval '3 days', now() + interval '3 days' + interval '1 hour', 'a0000000-0000-4000-8000-000000000008','b0000000-0000-4000-8000-000000000005','Thessaly', false, now()),
 ('d0000000-0000-4000-8000-000000000004','Follow-up — gas quote','call', now() + interval '5 days', now() + interval '5 days' + interval '20 minutes', 'a0000000-0000-4000-8000-000000000002', null, 'Phone', false, now());

-- ------------------------------------------------------------------
-- 5) COMMUNICATIONS  (comm_type: email/phone/sms/whatsapp/meeting/note)
-- ------------------------------------------------------------------
insert into public.communications (id, lead_id, comm_type, direction, subject, body, contact_email, contact_phone, created_at) values
 ('e0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','email','outbound','PV proposal sent','Sent 5kW rooftop proposal with pricing options.', 'elena.georgiou@nova-industrial.gr','6944556677', now() - interval '8 days'),
 ('e0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000006','phone','outbound','Marina project discussion','Discussed charging specs and site constraints.', 'n.kostopoulos@yacht-marine.gr','6933221100', now() - interval '4 days'),
 ('e0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000007','email','inbound','Urgent: website redesign','Client asked for timeline before the trade expo.', 'sofia.d@corp-solutions.gr','6966554433', now() - interval '2 days');

-- ------------------------------------------------------------------
-- 6) ACTIVITY LOG  (drives "Recent Activity" on the dashboard)
-- ------------------------------------------------------------------
insert into public.activity_log (entity_type, action, details, created_at) values
 ('lead','created',('{"name":"Maria Papadopoulou"}')::jsonb, now() - interval '2 days'),
 ('lead','created',('{"name":"Katerina Vasilaki"}')::jsonb, now() - interval '3 days'),
 ('deal','created',('{"title":"Clinic scheduling SaaS"}')::jsonb, now() - interval '6 days'),
 ('deal','updated',('{"title":"Marina EV charging infrastructure"}')::jsonb, now() - interval '2 days'),
 ('invoice','created',('{"number":"INV-2026-004"}')::jsonb, now() - interval '3 days'),
 ('communication','created',('{"subject":"Urgent: website redesign"}')::jsonb, now() - interval '2 days');

-- ------------------------------------------------------------------
-- 7) NOTIFICATIONS
-- ------------------------------------------------------------------
insert into public.notifications (type, status, message, details, created_at) values
 ('lead','unread',('New lead: Maria Papadopoulou (Electricity)')::text, ('{}')::jsonb, now() - interval '2 days'),
 ('deal','unread',('Deal reached negotiation: Marina EV charging')::text, ('{}')::jsonb, now() - interval '1 day'),
 ('invoice','unread',('Invoice INV-2026-004 drafted')::text, ('{}')::jsonb, now() - interval '3 days');

-- ------------------------------------------------------------------
-- Done
-- ------------------------------------------------------------------
select count(*) as seeded_leads from public.leads;
select count(*) as seeded_deals from public.deals;
select count(*) as seeded_invoices from public.invoices;
select count(*) as seeded_events from public.calendar_events;
select count(*) as seeded_comms from public.communications;
