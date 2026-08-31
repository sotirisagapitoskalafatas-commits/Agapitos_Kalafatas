import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { runCommand } from "@/lib/plugins/orchestrator";
import type { AgentContext } from "@/lib/agents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/agent/command — run a Small Business Plugin slash command.
// Requires an authenticated CRM admin session (commands may stage approval writes).
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return unauthorizedResponse();

  try {
    const { command, organizationId, userId, role } = await request.json();

    if (!command || typeof command !== "string" || !command.trim()) {
      return NextResponse.json({ error: "command is required (e.g. \"/invoice-chase\")" }, { status: 400 });
    }

    const context: AgentContext = {
      userId: String(userId || auth.user),
      organizationId: String(organizationId || ""),
      role: role === "owner" || role === "admin" || role === "member" ? role : "admin",
      requestId: randomUUID(),
    };

    const result = await runCommand(context, command.trim());
    return NextResponse.json({ requestId: context.requestId, ...result });
  } catch (e: any) {
    console.error("Agent command API error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
