import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { orchestrate } from "@/lib/agents/orchestrator";
import { requireAuth } from "@/lib/admin-auth";
import type { AgentContext } from "@/lib/agents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function writeEvent(controller: ReadableStreamDefaultController, data: unknown) {
  controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }) + "\n", {
      status: 401,
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }

  const { message, organizationId, userId, role } = await request.json();

  if (!message || typeof message !== "string" || !message.trim()) {
    return new Response(
      JSON.stringify({ error: "message is required" }) + "\n",
      { status: 400, headers: { "Content-Type": "application/x-ndjson" } }
    );
  }

  const context: AgentContext = {
    userId: String(userId || auth.user),
    organizationId: String(organizationId || ""),
    role: role === "owner" || role === "admin" || role === "member" ? role : "admin",
    requestId: randomUUID(),
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        writeEvent(controller, { type: "start", requestId: context.requestId });

        const result = await orchestrate(context, message.trim(), (event) => {
          writeEvent(controller, { type: "progress", ...event });
        });

        writeEvent(controller, { type: "result", requestId: context.requestId, ...result });
      } catch (error: any) {
        writeEvent(controller, {
          type: "error",
          requestId: context.requestId,
          error: "Internal server error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
