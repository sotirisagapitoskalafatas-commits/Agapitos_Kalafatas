// Survivor orchestration facade: experiment lifecycle + dashboard aggregation.
// Wires the pure domain modules (ledger, survival, scoring, brain, jobs, learning)
// to Supabase with the service role.
import { supabase } from "./db";
import { survivorConfig, assertSafeLimits } from "./config";
import { computeBalance } from "./ledger";
import { decideSurvival } from "./survival";
import { allSandboxOpportunities, sandboxBatch } from "./source";
import { planProposals, stageProposals } from "./brain";
import { advanceJob, buildPaymentEntry } from "./jobs";
import { buildPostmortem, applyGradient } from "./learning";
import type {
  Experiment,
  Job,
  LedgerTransaction,
  MemoryRecord,
  Opportunity,
  Proposal,
  Strategy,
  SurvivalState,
  SurvivorAgent,
  WalletView,
} from "./types";

const DEFAULT_AGENT_NAME = "Freelance Survivor (Atlas sandbox)";

// ── Agent + wallet bootstrap ─────────────────────────────────────────────────

export async function ensureAgent(): Promise<SurvivorAgent> {
  const cfg = survivorConfig();
  const { data: existing, error: exErr } = await supabase
    .from("survivor_agents")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (exErr) throw new Error(exErr.message);

  if (existing) {
    if (existing.status === "dead") return existing;
    return existing;
  }

  const { data: agent, error: insErr } = await supabase
    .from("survivor_agents")
    .insert({ name: DEFAULT_AGENT_NAME, status: "alive" })
    .select()
    .single();
  if (insErr) throw new Error(insErr.message);

  // Seed the ledger with starting capital (immutable first entry).
  const { error: txErr } = await supabase.from("survivor_transactions").insert({
    agent_id: agent.id,
    type: "deposit",
    amount: cfg.startingCapital,
    currency: "EUR",
    description: "Starting capital (sandbox)",
    reference_id: `seed:${agent.id}:0`,
    balance_after: cfg.startingCapital,
  });
  if (txErr) throw new Error(txErr.message);

  // Default balanced profile.
  const { error: stratErr } = await supabase.from("survivor_strategies").insert({
    agent_id: agent.id,
    profile: "balanced",
    active: true,
    params: { valueWeight: 0.3, deadlineWeight: 0.2, complexityWeight: 0.2, riskTolerance: 0.2, minScore: 55 },
  });
  if (stratErr) throw new Error(stratErr.message);

  return agent;
}

export async function getWalletView(): Promise<WalletView> {
  const agent = await getAgentOrThrow();
  const txs = await listTransactions(agent.id);
  const balance = computeBalance(txs);

  // Sum of staged-but-undecided bid payloads (pending) and approved jobs (reserved).
  const { data: pending } = await supabase
    .from("agent_action_approvals")
    .select("payload")
    .eq("action_type", "survivor_propose")
    .eq("status", "pending");
  const { data: jobs } = await supabase
    .from("survivor_jobs")
    .select("value,status")
    .eq("agent_id", agent.id)
    .in("status", ["won", "in_progress", "delivered"]);

  const pendingBids = (pending || []).reduce((sum, a) => sum + Number(a.payload?.value || 0), 0);
  const reserved = (jobs || []).reduce((sum, j) => sum + Number(j.value || 0), 0);

  return {
    agentId: agent.id,
    name: agent.name,
    status: agent.status as SurvivalState,
    balance,
    pendingBids,
    reserved,
    currency: "EUR",
  };
}

// ── Experiment execution (sandbox) ──────────────────────────────────────────

export async function runExperiment(): Promise<{
  agent: SurvivorAgent;
  plan: { bidsStaged: number; skipped: number };
  experiment: Experiment;
}> {
  const cfg = survivorConfig();
  assertSafeLimits(cfg);
  const agent = await ensureAgent();

  const wallet = await getWalletView();
  if (decideSurvival(wallet.balance, cfg) === "dead") {
    throw new Error("Agent is DEAD — experiment frozen. Reset or top up before running.");
  }
  if (decideSurvival(wallet.balance, cfg) === "hybernating") {
    throw new Error("Agent is HYBERNATING — balance below min runway.");
  }

  // In sandbox mode, generate fresh opportunities each run. Persist them so
  // proposals/jobs can reference real rows (source:/type independent).
  const candidates: Opportunity[] =
    cfg.mode === "sandbox"
      ? sandboxBatch(cfg.opportunityBatch)
      : allSandboxOpportunities();

  const opportunities = await persistOpportunities(candidates);

  const { data: strategy } = await supabase
    .from("survivor_strategies")
    .select("*")
    .eq("agent_id", agent.id)
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const params = strategy?.params || { valueWeight: 0.3, deadlineWeight: 0.2, complexityWeight: 0.2, riskTolerance: 0.2, minScore: 55 };

  const plan = planProposals(opportunities, params, cfg, wallet.pendingBids);
  const approvalIds = await stageProposals(
    { requestId: `sbx:run:${Date.now()}`, organizationId: "", userId: "", role: "admin" },
    agent.id,
    plan,
  );

  // Log experiment + memory.
  const { data: experiment } = await supabase.from("survivor_experiments").insert({
    name: `Exp ${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString("el-GR")}`,
    status: "running",
    summary: JSON.stringify({
      bids: plan.bidsStaged.length,
      skipped: plan.skipped.length,
      approvals: approvalIds.length,
    }),
  }).select().single();

  await remember(agent.id, "fact", `Experiment run: ${plan.bidsStaged.length} bids staged, ${plan.skipped.length} skipped.`);

  return { agent, plan: { bidsStaged: plan.bidsStaged.length, skipped: plan.skipped.length }, experiment: experiment as Experiment };
}

// Simulate one tick of the sandbox job engine: advance open jobs, collect payments.
export async function simulateJobs(): Promise<{ advanced: number; payments: number; credits: number }> {
  const agent = await getAgentOrThrow();
  const { data: jobs, error } = await supabase
    .from("survivor_jobs")
    .select("*")
    .eq("agent_id", agent.id)
    .in("status", ["won", "in_progress", "delivered"])
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  let advanced = 0;
  let payments = 0;
  let credits = 0;
  const memories: string[] = [];

  for (const job of (jobs || []) as Job[]) {
    const { next, credit, memory } = advanceJob(job);
    if (next.status === job.status && !credit) continue;

    await supabase.from("survivor_jobs").update({ status: next.status, updated_at: next.updated_at }).eq("id", job.id);
    advanced++;

    if (credit) {
      const txs = await listTransactions(agent.id);
      const balanceBefore = computeBalance(txs);
      const entry = buildPaymentEntry(agent.id, { ...next, status: "paid" }, balanceBefore);
      const { error: txErr } = await supabase.from("survivor_transactions").insert(entry);
      if (txErr) throw new Error(txErr.message);
      payments++;
      credits += credit;
    }
    if (memory) memories.push(memory);
  }

  // Postmortems + learning for finished jobs.
  const { data: finished } = await supabase
    .from("survivor_jobs")
    .select("*")
    .eq("agent_id", agent.id)
    .in("status", ["paid", "failed"]);
  for (const job of (finished || []) as Job[]) {
    const memo = remember(agent.id, "postmortem", buildPostmortem(job, job.status === "paid").lesson);
    const pm = buildPostmortem(job, job.status === "paid");
    await adjustStrategy(agent.id, pm.delta);
  }
  for (const m of memories) await remember(agent.id, "lesson", m);

  return { advanced, payments, credits };
}

// ── Learning / memory helpers ───────────────────────────────────────────────

export async function remember(
  agentId: string,
  kind: MemoryRecord["kind"],
  content: string,
  source?: string,
): Promise<void> {
  await supabase.from("survivor_memory").insert({
    agent_id: agentId,
    kind,
    content,
    source: source || null,
    confidence: 0.5,
  });
}

export async function adjustStrategy(agentId: string, delta: Partial<Record<string, number>>): Promise<void> {
  const { data: strategy } = await supabase
    .from("survivor_strategies")
    .select("*")
    .eq("agent_id", agentId)
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (!strategy) return;
  const clamped = applyGradient(strategy.params, delta as any);
  await supabase
    .from("survivor_strategies")
    .update({ params: clamped, updated_at: new Date().toISOString() })
    .eq("id", strategy.id);
}

// ── Dashboard aggregation ───────────────────────────────────────────────────

export interface SurvivorDashboard {
  config: ReturnType<typeof survivorConfig>;
  agent: SurvivorAgent | null;
  wallet: WalletView;
  survival: SurvivalState;
  transactions: LedgerTransaction[];
  opportunities: Opportunity[];
  proposals: Proposal[];
  jobs: Job[];
  strategy: Strategy | null;
  memory: MemoryRecord[];
  experiments: Experiment[];
}

export async function getDashboard(): Promise<SurvivorDashboard> {
  const cfg = survivorConfig();
  const agent = await getAgentOrNull();
  if (!agent) {
    // Not initialized yet: return a clean, actionable empty state.
    return {
      config: cfg,
      agent: null as any,
      wallet: { agentId: "", name: "Uninitialized", status: "alive", balance: 0, pendingBids: 0, reserved: 0, currency: "EUR" },
      survival: "alive",
      transactions: [],
      opportunities: [],
      proposals: [],
      jobs: [],
      strategy: null,
      memory: [],
      experiments: [],
    };
  }
  const wallet = await getWalletView();
  const status = decideSurvival(wallet.balance, cfg);

  const [transactions, opportunities, proposals, jobs, strategy, memory, experiments] =
    await Promise.all([
      listTransactions(agent.id),
      supabase.from("survivor_opportunities").select("*").eq("active", true).order("created_at", { ascending: false }).limit(50),
      supabase.from("survivor_proposals").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("survivor_jobs").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("survivor_strategies").select("*").eq("agent_id", agent.id).eq("active", true).limit(1).maybeSingle(),
      supabase.from("survivor_memory").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false }).limit(25),
      supabase.from("survivor_experiments").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

  return {
    config: cfg,
    agent,
    wallet,
    survival: status,
    transactions,
    opportunities: opportunities.data || [],
    proposals: proposals.data || [],
    jobs: jobs.data || [],
    strategy: (strategy.data as Strategy) || null,
    memory: memory.data || [],
    experiments: experiments.data || [],
  };
}

// ── Private helpers ──────────────────────────────────────────────────────────

async function getAgentOrThrow(): Promise<SurvivorAgent> {
  const { data, error } = await supabase
    .from("survivor_agents")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Survivor agent not initialized. No transactions.");
  return data as SurvivorAgent;
}

async function getAgentOrNull(): Promise<SurvivorAgent | null> {
  const { data, error } = await supabase
    .from("survivor_agents")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as SurvivorAgent) || null;
}

async function listTransactions(agentId: string): Promise<LedgerTransaction[]> {
  const { data, error } = await supabase
    .from("survivor_transactions")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as LedgerTransaction[];
}

// Insert opportunities and return their persisted rows (with real UUID ids).
async function persistOpportunities(candidates: Opportunity[]): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from("survivor_opportunities")
    .insert(candidates.map((o) => ({
      source: o.source,
      title: o.title,
      description: o.description,
      service_category: o.service_category,
      estimated_value: o.estimated_value,
      complexity: o.complexity,
      risk_percent: o.risk_percent,
      deadline_days: o.deadline_days,
      active: true,
    })))
    .select();
  if (error) throw new Error(error.message);
  return (data || []) as Opportunity[];
}