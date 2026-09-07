// Shared RAG + knowledge tools used by specialist agents.
import { supabase } from "./db";
import type { AgentContext } from "./types";

export async function searchKnowledge(
  context: AgentContext,
  args: { query: string; category?: string; limit?: number }
): Promise<any> {
  const query = String(args.query || "").trim().slice(0, 300);
  const limit = Math.min(Number(args.limit) || 3, 8);
  const category = args.category || null;

  if (!query) return { error: "query is required" };

  try {
    const sup = supabase;
    let q = sup
      .from("knowledge_base")
      .select("id, category, title, content, tags")
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(limit);

    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) return { error: error.message };
    return { results: data || [] };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function lookupLead(
  context: AgentContext,
  args: { query?: string; status?: string; limit?: number }
): Promise<any> {
  const limit = Math.min(Number(args.limit) || 5, 20);
  const sup = supabase;

  let q = sup
    .from("leads")
    .select("id, full_name, email, phone, status, source, service_category, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (args.query) {
    const text = String(args.query).trim();
    q = q.or(`full_name.ilike.%${text}%,email.ilike.%${text}%`);
  }
  // leads.status CHECK values are lowercase (new_lead, contacted, qualified,
  // customer, lost, archived) — normalize, don't uppercase.
  if (args.status) q = q.eq("status", String(args.status).toLowerCase());

  const { data, error } = await q;
  if (error) return { error: error.message };
  return { results: data || [] };
}

export async function searchDeals(
  context: AgentContext,
  args: { title?: string; stage?: string; minValue?: number; maxValue?: number; limit?: number }
): Promise<any> {
  const limit = Math.min(Number(args.limit) || 5, 20);
  let q = supabase
    .from("deals")
    .select("id, title, value, stage, probability, expected_close, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (args.stage) q = q.eq("stage", String(args.stage).toLowerCase());
  if (args.minValue != null) q = q.gte("value", Number(args.minValue));
  if (args.maxValue != null) q = q.lte("value", Number(args.maxValue));
  if (args.title) q = q.ilike("title", `%${args.title}%`);

  const { data, error } = await q;
  if (error) return { error: error.message };
  return { results: data || [] };
}

export async function getPipelineMetrics(
  context: AgentContext,
  args: Record<string, any>
): Promise<any> {
  const deals = await supabase.from("deals").select("stage, value, probability, status");
  if (deals.error) return { error: deals.error.message };

  // Live deals.stage CHECK: lead, qualified, proposal, negotiation,
  // closed_won, closed_lost.
  const WON = "closed_won";
  const LOST = "closed_lost";

  const stages: Record<string, { count: number; value: number }> = {};
  let wonValue = 0;
  let pipelineValue = 0;

  for (const d of deals.data || []) {
    stages[d.stage] = stages[d.stage] || { count: 0, value: 0 };
    stages[d.stage].count++;
    stages[d.stage].value += Number(d.value) || 0;
    if (d.stage === WON) wonValue += Number(d.value) || 0;
    if (d.stage !== WON && d.stage !== LOST) pipelineValue += Number(d.value) || 0;
  }

  return {
    stages,
    totalDeals: (deals.data || []).length,
    wonValue,
    pipelineValue,
    winRate: (deals.data || []).length
      ? Math.round(((stages[WON]?.count || 0) / (deals.data || []).length) * 100)
      : 0,
    closedLostValue: stages[LOST]?.value || 0,
  };
}

export async function getInvoices(
  context: AgentContext,
  args: { status?: string; limit?: number }
): Promise<any> {
  const limit = Math.min(Number(args.limit) || 10, 30);
  let q = supabase
    .from("invoices")
    .select("id, invoice_number, amount, currency, status, issued_at, due_at")
    .order("issued_at", { ascending: false })
    .limit(limit);

  if (args.status) q = q.eq("status", String(args.status).toLowerCase());

  const { data, error } = await q;
  if (error) return { error: error.message };
  return { results: data || [] };
}

// ── Tasks / Communications / Documents read tools (non-vector) ──
// There is no `tasks` table: calendar_events is the tasks/reminders store.
export async function getTasks(
  context: AgentContext,
  args: { eventType?: string; status?: string; limit?: number }
): Promise<any> {
  const limit = Math.min(Number(args.limit) || 10, 30);
  let q = supabase
    .from("calendar_events")
    .select("id, title, description, event_type, start_time, end_time, completed, created_at")
    .order("start_time", { ascending: true })
    .limit(limit);

  if (args.eventType) q = q.eq("event_type", String(args.eventType).toLowerCase());
  if (args.status) {
    const done = /^(done|completed|closed)$/.test(String(args.status).toLowerCase());
    q = q.eq("completed", !!done);
  }

  const { data, error } = await q;
  if (error) return { error: error.message };
  return {
    results: (data || []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      event_type: t.event_type,
      due: t.start_time,
      completed: t.completed,
    })),
  };
}

export async function getCommunications(
  context: AgentContext,
  args: { channel?: string; limit?: number }
): Promise<any> {
  const limit = Math.min(Number(args.limit) || 10, 30);
  let q = supabase
    .from("communications")
    .select("id, lead_id, direction, channel, subject, body, sent_at")
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (args.channel) q = q.eq("channel", String(args.channel).toLowerCase());

  const { data, error } = await q;
  if (error) return { error: error.message };
  return { results: data || [] };
}

export async function listDocuments(
  context: AgentContext,
  args: { limit?: number }
): Promise<any> {
  const limit = Math.min(Number(args.limit) || 20, 50);
  const { data, error } = await supabase.storage
    .from("client_documents")
    .list("", { limit });
  if (error) return { error: error.message };
  return { results: data || [] };
}
