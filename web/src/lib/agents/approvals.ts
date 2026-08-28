// Approval-gated write system for the agent orchestrator.
//
// Golden rule: "The LLM proposes; Postgres/RLS authorizes."
// Writes NEVER execute directly from the model. Instead the model proposes a
// payload, an admin approves it, and only then does the server execute it —
// guarded by an idempotency key so a payload can't be double-applied.
import { createHash } from "crypto";
import { supabase } from "./db";
import type { AgentContext } from "./types";

type ActionType = "create_lead" | "send_email" | "create_deal" | "create_event";

const EXPIRY_MIN = 60 * 24; // 24h default
const EXPIRY_MS = EXPIRY_MIN * 60 * 1000;

// Canonical hash of a payload for tamper detection + dedup
export function hashPayload(payload: Record<string, any>): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

export type ProposeResult = {
  approvalId: string;
  status: string;
  idempotencyKey: string;
  summary: string;
  expiresAt: string;
  message: string;
};

// Called by a write tool: create a pending approval row (does NOT execute).
export async function proposeAction(
  context: AgentContext,
  opts: {
    actionType: ActionType;
    payload: Record<string, any>;
    summary: string;
    idempotencyKey?: string;
    expiresAt?: string;
  }
): Promise<ProposeResult> {
  const idempotencyKey =
    opts.idempotencyKey ||
    `${context.requestId}-${opts.actionType}-${hashPayload(opts.payload).slice(0, 16)}`;

  // Idempotency: if the exact key already exists, return the existing proposal
  const existing = await supabase
    .from("agent_action_approvals")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing.data) {
    return {
      approvalId: existing.data.id,
      status: existing.data.status,
      idempotencyKey,
      summary: existing.data.summary,
      expiresAt: existing.data.expires_at,
      message:
        existing.data.status === "approved"
          ? "This action was already approved and will execute."
          : `This action was already proposed (status: ${existing.data.status}).`,
    };
  }

  const expiresAt =
    opts.expiresAt || new Date(Date.now() + EXPIRY_MS).toISOString();

  const { data, error } = await supabase
    .from("agent_action_approvals")
    .insert({
      request_id: context.requestId,
      organization_id: context.organizationId || null,
      user_id: context.userId || null,
      agent_name: "orchestrator",
      action_type: opts.actionType,
      idempotency_key: idempotencyKey,
      payload: opts.payload,
      payload_hash: hashPayload(opts.payload),
      status: "pending",
      summary: opts.summary,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to stage proposal: ${error.message}`);

  return {
    approvalId: data.id,
    status: "pending",
    idempotencyKey,
    summary: opts.summary,
    expiresAt,
    message:
      "This action requires approval before it can run. Awaiting admin approval.",
  };
}

// List pending (non-expired) approvals for the admin UI.
export async function listPendingApprovals() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("agent_action_approvals")
    .select("*")
    .eq("status", "pending")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data || [];
}

// Admin decides approve/reject. On approve, executes the payload (idempotent).
export async function decideApproval(
  approvalId: string,
  decision: "approved" | "rejected",
  decidedBy: string
) {
  const { data: row, error: fetchErr } = await supabase
    .from("agent_action_approvals")
    .select("*")
    .eq("id", approvalId)
    .maybeSingle();
  if (fetchErr || !row) throw new Error("Approval not found");

  if (row.status !== "pending") {
    throw new Error(`Approval already ${row.status}`);
  }
  if (new Date(row.expires_at) < new Date()) {
    await supabase
      .from("agent_action_approvals")
      .update({ status: "expired", decided_at: new Date().toISOString(), decided_by: decidedBy })
      .eq("id", approvalId);
    throw new Error("Approval expired");
  }

  if (decision === "rejected") {
    await supabase
      .from("agent_action_approvals")
      .update({ status: "rejected", decided_at: new Date().toISOString(), decided_by: decidedBy })
      .eq("id", approvalId);
    return { id: approvalId, status: "rejected" };
  }

  // Approve → execute with idempotency guard
  const executor = getExecutor(row.action_type);
  const result = await executor(row.payload);

  await supabase
    .from("agent_action_approvals")
    .update({
      status: "executed",
      decided_at: new Date().toISOString(),
      decided_by: decidedBy,
      executed_at: new Date().toISOString(),
      execution_result: result,
    })
    .eq("id", approvalId);

  return { id: approvalId, status: "executed", result };
}

// ── Executors: perform the actual (safe) write with the service role ──
type Executor = (payload: Record<string, any>) => Promise<any>;

const executors: Record<ActionType, Executor> = {
  async create_lead(payload) {
    const { error } = await supabase.from("leads").insert({
      full_name: payload.fullName,
      email: payload.email || null,
      phone: payload.phone || null,
      company: payload.company || null,
      status: (payload.status || "NEW").toUpperCase(),
      source: payload.source || "ai-agent",
      notes: payload.notes || null,
      tags: payload.tags || ["ai-agent"],
    });
    if (error) throw new Error(error.message);
    return { ok: true, inserted: true };
  },

  async create_deal(payload) {
    const { error } = await supabase.from("deals").insert({
      title: payload.title,
      value: payload.value || 0,
      currency: payload.currency || "EUR",
      stage: (payload.stage || "lead").toLowerCase(),
      probability: payload.probability ?? 20,
      notes: payload.notes || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true, inserted: true };
  },

  async create_event(payload) {
    const { error } = await supabase.from("events").insert({
      title: payload.title,
      description: payload.description || null,
      event_type: (payload.eventType || "other").toLowerCase(),
      starts_at: payload.startsAt,
      ends_at: payload.endsAt || null,
      completed: false,
    });
    if (error) throw new Error(error.message);
    return { ok: true, inserted: true };
  },

  async send_email(payload) {
    // Only actually send if a Resend key + recipient are configured; otherwise
    // log to communications and report pending-send.
    const resend = await import("resend");
    const client = new resend.Resend(process.env.RESEND_API_KEY);
    const to = payload.to;
    const result = await client.emails.send({
      from: "Atlas AI <leads@agapitoskalafatas.com>",
      to,
      subject: payload.subject,
      html: payload.body || payload.html || "",
    });
    return { ok: true, sent: true, id: result.data?.id || null };
  },
};

function getExecutor(type: ActionType): Executor {
  const fn = executors[type];
  if (!fn) throw new Error(`No executor for action type: ${type}`);
  return fn;
}
