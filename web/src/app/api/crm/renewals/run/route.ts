import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { runRenewalScan, runRenewalMaterialize, sendRenewalOwnerEmails } from "@/lib/spine/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = (await req.json().catch(() => ({}))) as {
    windows?: unknown;
    actionWindows?: unknown;
    email?: unknown;
  };

  const windows: number[] | undefined = Array.isArray(body.windows)
    ? body.windows.filter((n: unknown) => typeof n === "number" && Number.isFinite(n))
    : undefined;
  const actionWindows: number[] | undefined = Array.isArray(body.actionWindows)
    ? body.actionWindows.filter((n: unknown) => typeof n === "number" && Number.isFinite(n))
    : undefined;
  const emailEnabled = body.email !== false;

  const scan = await runRenewalScan(supabase, windows);
  const materialize = await runRenewalMaterialize(supabase, actionWindows);
  if (!scan.migrated && !materialize.migrated) {
    return NextResponse.json(
      {
        error:
          "Renewal engine is not migrated yet. Apply web/config/2026-09-08-foundation-spine.sql (and 2026-09-08-renewal-materialize.sql) first.",
        detail: scan.error || materialize.error,
      },
      { status: 501 }
    );
  }
  if (scan.error) return NextResponse.json({ error: scan.error, step: "scan" }, { status: 500 });
  if (materialize.error)
    return NextResponse.json({ error: materialize.error, step: "materialize" }, { status: 500 });

  let email = { sent: 0, skipped: [] as string[] };
  if (emailEnabled) {
    email = await sendRenewalOwnerEmails(supabase);
  }

  return NextResponse.json({
    scanned: scan.inserted,
    materialized: materialize.materialized,
    ownerEmailsSent: email.sent,
    ownerEmailSkipped: email.skipped,
  });
}