import { NextRequest, NextResponse } from "next/server";
import { listPendingApprovals, decideApproval } from "@/lib/agents/approvals";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/agent/approvals — list pending actions requiring admin approval
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();
  try {
    const approvals = await listPendingApprovals();
    return NextResponse.json({ approvals });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/agent/approvals — { approvalId, decision: "approved" | "rejected" }
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return unauthorizedResponse();
  try {
    const { approvalId, decision, decidedBy } = await request.json();
    if (!approvalId || !decision) {
      return NextResponse.json({ error: "approvalId and decision are required" }, { status: 400 });
    }
    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json({ error: "decision must be approved or rejected" }, { status: 400 });
    }
    const result = await decideApproval(approvalId, decision, String(decidedBy || "admin"));
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
