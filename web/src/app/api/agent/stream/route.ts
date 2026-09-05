import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { orchestrate } from "@/lib/agents/orchestrator";
import type { AgentContext } from "@/lib/agents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function writeEvent(controller: ReadableStreamDefaultController, data: unknown) {
  controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
}

export async function POST(request: NextRequest) {
  const { message, organizationId, userId, role } = await request.json();

  if (!message || typeof message !== "string" || !message.trim()) {
    return new Response(
      JSON.stringify({ error: "message is required" }) + "\n",
      { status: 400, headers: { "Content-Type": "application/x-ndjson" } }
    );
  }

  const context: AgentContext = {
    userId: String(userId || "system"),
    organizationId: String(organizationId || ""),
    role: role === "owner" || role === "admin" || role === "member" ? role : "member",
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
          error: error.message || "Internal server error",
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
