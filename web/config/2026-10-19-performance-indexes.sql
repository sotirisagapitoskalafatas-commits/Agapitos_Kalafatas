-- 2026-10-19 — indexes for the CRM's high-frequency joins.
-- All indexes are additive and safe to re-run.
CREATE INDEX IF NOT EXISTS calendar_events_deal_id_idx
  ON public.calendar_events(deal_id);
CREATE INDEX IF NOT EXISTS calendar_events_lead_id_idx
  ON public.calendar_events(lead_id);
CREATE INDEX IF NOT EXISTS communications_deal_id_idx
  ON public.communications(deal_id);
CREATE INDEX IF NOT EXISTS creative_assets_parent_asset_id_idx
  ON public.creative_assets(parent_asset_id);
CREATE INDEX IF NOT EXISTS invoices_deal_id_idx
  ON public.invoices(deal_id);
CREATE INDEX IF NOT EXISTS invoices_lead_id_idx
  ON public.invoices(lead_id);
CREATE INDEX IF NOT EXISTS renewal_reminders_task_id_idx
  ON public.renewal_reminders(task_id);
