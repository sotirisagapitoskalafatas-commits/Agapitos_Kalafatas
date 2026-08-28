import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { orchestrate } from "@/lib/agents/orchestrator";
import type { AgentContext } from "@/lib/agents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { message, organizationId, userId, role } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const context: AgentContext = {
      userId: String(userId || "system"),
      organizationId: String(organizationId || ""),
      role: role === "owner" || role === "admin" || role === "member" ? role : "member",
      requestId: randomUUID(),
    };

    const result = await orchestrate(context, message.trim());

    return NextResponse.json({
      requestId: context.requestId,
      ...result,
    });
  } catch (error: any) {
    console.error("Agent API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
