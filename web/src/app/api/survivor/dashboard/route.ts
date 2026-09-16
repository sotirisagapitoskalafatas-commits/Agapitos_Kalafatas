import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { getDashboard } from "@/lib/survivor/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();
  try {
    const dashboard = await getDashboard();
    return NextResponse.json({ ...dashboard, ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, ok: false }, { status: 500 });
  }
}