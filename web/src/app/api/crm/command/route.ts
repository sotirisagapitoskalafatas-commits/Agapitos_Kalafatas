import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { buildCommandCenter } from "@/lib/spine/command";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 3600000).toISOString();

  const [leadsRes, tasksRes, invoicesRes, commsRes, approvalsRes, auditRes, notifRes, creativeRes, activityRes, dealsRes] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id, full_name, first_name, last_name, client_name, email, status, service_category, source, created_at, updated_at, renewal_date, provider, assigned_agent"),
      supabase
        .from("calendar_events")
        .select("id, title, event_type, start_time, end_time, completed, lead_id")
        .in("event_type", ["task", "reminder"])
        .limit(500),
      supabase
        .from("invoices")
        .select("id, invoice_number, type, status, total, created_at, paid_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("communications")
        .select("id, lead_id, comm_type, direction, created_at")
        .limit(500),
      supabase
        .from("agent_action_approvals")
        .select("id, agent_name, action_type, summary, status, expires_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("agent_audit")
        .select("id, agent_name, output_summary, tier, duration_ms, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("notifications")
        .select("id, type, status, message, details, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("creative_runs")
        .select("id, kind, status, result, created_at")
        .gte("created_at", dayAgo)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(50),
      supabase
        .from("deals")
        .select("id, stage, value, currency, created_at")
        .limit(500),
    ]);

  const firstError =
    leadsRes.error ||
    tasksRes.error ||
    invoicesRes.error ||
    commsRes.error ||
    activityRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const data = buildCommandCenter({
    leads: leadsRes.data ?? [],
    tasks: tasksRes.data ?? [],
    invoices: invoicesRes.data ?? [],
    communications: commsRes.data ?? [],
    approvals: approvalsRes.data ?? [],
    agentAudit: auditRes.data ?? [],
    notifications: notifRes.data ?? [],
    creativeRuns: creativeRes.data ?? [],
    activity: activityRes.data ?? [],
    deals: dealsRes.data ?? [],
    now,
  });

  return NextResponse.json(data);
}