import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/agents/db";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { approveRun } from "@/lib/creative/server";



export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = await req.json().catch(() => null);
  if (!body || typeof body.assetId !== "string" || !body.assetId) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 });
  }
  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  try {
    const result = await approveRun(supabase, {
      user: auth.user,
      assetId: body.assetId,
      action: body.action,
      note: typeof body.note === "string" ? body.note : undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Approval action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}