import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { runRenewalScan } from "@/lib/spine/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const windows: number[] | undefined = Array.isArray(body.windows)
    ? body.windows.filter((n: unknown) => typeof n === "number" && Number.isFinite(n))
    : undefined;

  const result = await runRenewalScan(supabase, windows);
  if (!result.migrated) {
    return NextResponse.json(
      {
        error:
          "Renewal engine is not migrated yet. Apply web/config/2026-09-08-foundation-spine.sql first.",
        detail: result.error,
      },
      { status: 501 }
    );
  }
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ inserted: result.inserted });
}