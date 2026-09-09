import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { buildCustomerIndex, buildCustomer360 } from "@/lib/spine/customers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input as any, { ...init, cache: "no-store" }),
    },
  }
);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const leadId = req.nextUrl.searchParams.get("id");
  const now = new Date();

  const [leadsRes, requestsRes, dealsRes, invoicesRes, commsRes, eventsRes, remindersRes, activityRes] =
    await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase
        .from("service_requests")
        .select("id, lead_id, service, service_type, reason, description, status, priority, owner, source, campaign, utm_source, utm_medium, utm_campaign, utm_term, next_action, lost_reason, closed_reason, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("deals")
        .select("id, lead_id, title, value, currency, stage, expected_close_date, closed_at, created_at")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("invoices")
        .select("id, lead_id, deal_id, invoice_number, type, status, total, currency, valid_until, paid_at, created_at")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("communications")
        .select("id, lead_id, deal_id, comm_type, direction, subject, body, created_at")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("calendar_events")
        .select("id, lead_id, deal_id, title, description, event_type, start_time, end_time, completed, created_at")
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("renewal_reminders")
        .select("id, lead_id, renewal_date, window_days, status, due_at, sent_at, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(500),
    ]);

  const firstError =
    leadsRes.error || requestsRes.error || dealsRes.error || invoicesRes.error || commsRes.error || eventsRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const input = {
    leads: leadsRes.data ?? [],
    requests: requestsRes.data ?? [],
    deals: dealsRes.data ?? [],
    invoices: invoicesRes.data ?? [],
    communications: commsRes.data ?? [],
    events: eventsRes.data ?? [],
    reminders: remindersRes.data ?? [],
    activity: activityRes.data ?? [],
    now,
  };

  const index = buildCustomerIndex(input);
  const customer360 = leadId ? buildCustomer360(input, leadId) : null;

  return NextResponse.json({ index, customer360, requestedId: leadId });
}
