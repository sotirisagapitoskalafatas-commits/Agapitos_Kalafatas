import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { upcomingRenewals, overdueRenewals } from "@/lib/spine/renewal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RenewalRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  service_category: string | null;
  renewal_date: string | null;
  status: string | null;
};

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const horizon = Math.min(Math.max(Number(new URL(req.url).searchParams.get("days")) || 30, 1), 365);
  const includeOverdue = new URL(req.url).searchParams.get("overdue") === "1";

  const today = new Date();
  const until = new Date(today);
  until.setUTCDate(until.getUTCDate() + horizon);

  const fromIso = today.toISOString().slice(0, 10);
  const untilIso = until.toISOString().slice(0, 10);

  const { data: rows, error } = await supabase
    .from("leads")
    .select("id, full_name, email, service_category, renewal_date, status")
    .gte("renewal_date", fromIso)
    .lte("renewal_date", untilIso)
    .order("renewal_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Overdue = customer leads whose renewal_date has passed. Direct query only —
  // the scan never creates historical reminders, so overdue renewals must come
  // from the source table, not the reminder ledger.
  const { data: overdue, error: overdueError } = includeOverdue
    ? await supabase
        .from("leads")
        .select("id, full_name, email, service_category, renewal_date, status")
        .eq("status", "customer")
        .lt("renewal_date", fromIso)
        .order("renewal_date", { ascending: false })
    : { data: null, error: null };

  if (overdueError) {
    return NextResponse.json({ error: overdueError.message }, { status: 500 });
  }

  const renewals = upcomingRenewals(
    (rows ?? []).filter((r) => r.renewal_date),
    horizon
  );

  const allLeadIds = Array.from(
    new Set([
      ...renewals.map((r) => r.leadId),
      ...(overdue ?? []).map((o) => (o as RenewalRow).id),
    ])
  );

  // Best-effort enrichment with engine reminders + materialized task state.
  // A lead can have one reminder per window (backfill ledger). Surface the most
  // actionable one: first by status (sent > materialized > pending), then one
  // that already produced a CRM task, then the smallest window.
  let reminderByLead: Record<string, { status: string; task_id: string | null; window_days: number }> = {};
  try {
    if (allLeadIds.length > 0) {
      const { data: reminders } = await supabase
        .from("renewal_reminders")
        .select("lead_id, status, task_id, materialized_at, window_days")
        .in("lead_id", allLeadIds);
      if (reminders) {
        const prio = (s: string) => ({ sent: 0, materialized: 1, pending: 2 }[s] ?? 9);
        const better = (a: (typeof reminders)[0], b: { status: string; task_id: string | null; window_days: number }) =>
          prio(a.status) < prio(b.status) ||
          (prio(a.status) === prio(b.status) &&
            ((a.task_id && !b.task_id) ||
              (!!a.task_id === !!b.task_id && (a.window_days ?? 999) < (b.window_days ?? 999))));
        for (const rm of reminders) {
          const cur = reminderByLead[rm.lead_id];
          if (!cur || better(rm, cur)) {
            reminderByLead[rm.lead_id] = {
              status: rm.status,
              task_id: rm.task_id,
              window_days: rm.window_days,
            };
          }
        }
      }
    }
  } catch {
    reminderByLead = {};
  }

  const withReminder = (r: { leadId: string } & Record<string, unknown>) => {
    const rm = reminderByLead[r.leadId];
    return {
      ...r,
      reminderStatus: rm?.status ?? "none",
      taskId: rm?.task_id ?? null,
      window: r.window ?? rm?.window_days ?? null,
    };
  };

  const overdueOut = overdueRenewals((overdue ?? []) as RenewalRow[]).map((o) => {
    const rm = reminderByLead[o.leadId];
    return {
      ...o,
      reminderStatus: rm?.status ?? "none",
      taskId: rm?.task_id ?? null,
      window: rm?.window_days ?? null,
    };
  });

  return NextResponse.json({
    asOf: today.toISOString(),
    horizonDays: horizon,
    renewals: renewals.map(withReminder),
    overdue: includeOverdue ? overdueOut : [],
    counts: {
      total: renewals.length,
      overdue: (overdue ?? []).length,
      byWindow: renewals.reduce<Record<string, number>>((acc, r) => {
        acc[String(r.window)] = (acc[String(r.window)] || 0) + 1;
        return acc;
      }, {}),
    },
  });
}