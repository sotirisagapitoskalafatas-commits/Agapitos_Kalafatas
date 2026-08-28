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
  if (args.status) q = q.eq("status", String(args.status).toUpperCase());

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

  const stages: Record<string, { count: number; value: number }> = {};
  let wonValue = 0;
  let pipelineValue = 0;

  for (const d of deals.data || []) {
    stages[d.stage] = stages[d.stage] || { count: 0, value: 0 };
    stages[d.stage].count++;
    stages[d.stage].value += Number(d.value) || 0;
    if (d.stage === "won") wonValue += Number(d.value) || 0;
    if (d.stage !== "won" && d.stage !== "lost") pipelineValue += Number(d.value) || 0;
  }

  return {
    stages,
    totalDeals: (deals.data || []).length,
    wonValue,
    pipelineValue,
    winRate: (deals.data || []).length
      ? Math.round(((stages.won?.count || 0) / (deals.data || []).length) * 100)
      : 0,
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
