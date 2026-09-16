import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { simulateJobs } from "@/lib/survivor/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/survivor/simulate — advance approved jobs (sandbox engine tick)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();
  try {
    const result = await simulateJobs();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, ok: false }, { status: 400 });
  }
}