import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { runExperiment } from "@/lib/survivor/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/survivor/run — start an experiment: stage bids for approval
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();
  try {
    const result = await runExperiment();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, ok: false }, { status: 400 });
  }
}