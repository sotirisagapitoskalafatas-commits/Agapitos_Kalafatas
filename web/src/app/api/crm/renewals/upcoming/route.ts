import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { upcomingRenewals } from "@/lib/spine/renewal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const horizon = Math.min(Math.max(Number(new URL(req.url).searchParams.get("days")) || 30, 1), 365);

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

  const renewals = upcomingRenewals(
    (rows ?? []).filter((r) => r.renewal_date),
    horizon
  );

  // Best-effort enrichment with engine reminder status (fails silently pre-migration).
  let statusByLead: Record<string, string> = {};
  try {
    if (renewals.length > 0) {
      const { data: reminders } = await supabase
        .from("renewal_reminders")
        .select("lead_id, status")
        .in("lead_id", renewals.map((r) => r.leadId));
      if (reminders) {
        for (const rm of reminders) {
          if (rm.status === "pending") statusByLead[rm.lead_id] = "pending";
        }
      }
    }
  } catch {
    statusByLead = {};
  }

  return NextResponse.json({
    asOf: today.toISOString(),
    horizonDays: horizon,
    renewals: renewals.map((r) => ({
      ...r,
      reminderStatus: statusByLead[r.leadId] ?? "computed",
    })),
    counts: {
      total: renewals.length,
      byWindow: renewals.reduce<Record<string, number>>((acc, r) => {
        acc[String(r.window)] = (acc[String(r.window)] || 0) + 1;
        return acc;
      }, {}),
    },
  });
}