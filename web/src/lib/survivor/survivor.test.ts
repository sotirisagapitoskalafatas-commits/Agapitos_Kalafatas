import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CONFIG, survivorConfig } from "./config.ts";
import { computeBalance, isCreditType, isDebitType, deduplicateTransactions, emptyWallet } from "./ledger.ts";
import { decideSurvival, assertOperational, type SurvivalState } from "./survival.ts";
import { scoreOpportunity, planProposals, STRATEGY_PROFILES } from "./scoring.ts";
import { sandboxBatch, allSandboxOpportunities } from "./source.ts";
import { advanceJob, buildPaymentEntry } from "./jobs.ts";
import { buildPostmortem, applyGradient } from "./learning.ts";

const CFG = {
  mode: "sandbox" as const,
  requireHumanApproval: true,
  startingCapital: 25,
  maxSingleExpense: 2,
  maxDailyExpense: 5,
  maxRiskPercent: 10,
  minRunway: 3,
  opportunityBatch: 12,
  deadlinePenaltyDays: 7,
  bidsPerRun: 4,
};

test("config defaults are sandbox-safe and bounded", () => {
  assert.equal(DEFAULT_CONFIG.mode, "sandbox");
  assert.equal(DEFAULT_CONFIG.startingCapital, 25);
  assert.equal(DEFAULT_CONFIG.maxSingleExpense, 2);
  assert.equal(DEFAULT_CONFIG.maxDailyExpense, 5);
  assert.equal(DEFAULT_CONFIG.maxRiskPercent, 10);
});

test("ledger classifies credit/debit types correctly", () => {
  assert.equal(isCreditType("deposit"), true);
  assert.equal(isCreditType("income"), true);
  assert.equal(isCreditType("payment"), true);
  assert.equal(isDebitType("spend"), true);
  assert.equal(isDebitType("expense"), true);
  assert.equal(isDebitType("payment"), false);
  assert.equal(isCreditType("spend"), false);
});

test("computeBalance sums signed entries chronologically", () => {
  const txs = [
    { type: "deposit", amount: 25, balance_after: 25 },
    { type: "spend", amount: 2, balance_after: 23 },
    { type: "payment", amount: 18, balance_after: 41 },
  ] as any;
  assert.equal(computeBalance(txs), 41);
});

test("deduplicateTransactions keeps first by reference_id", () => {
  const a = { id: "1", reference_id: "r1", amount: 5 } as any;
  const b = { id: "2", reference_id: "r1", amount: 99 } as any;
  const c = { id: "3", reference_id: "r2", amount: 1 } as any;
  const dedup = deduplicateTransactions([b, a, c]);
  assert.equal(dedup.length, 2);
  assert.equal(dedup.find((t) => t.reference_id === "r1").amount, 99);
});

test("emptyWallet starts at zero", () => {
  const w = emptyWallet("agent-1", "Survivor");
  assert.equal(w.balance, 0);
  assert.equal(w.pendingBids, 0);
  assert.equal(w.currency, "EUR");
});

test("decideSurvival state machine", () => {
  assert.equal(decideSurvival(0, CFG), "dead");
  assert.equal(decideSurvival(-5, CFG), "dead");
  assert.equal(decideSurvival(2, CFG), "hybernating");
  assert.equal(decideSurvival(3, CFG), "alive");
  assert.equal(decideSurvival(50, CFG), "alive");
});

test("assertOperational gates dead/hybernating", () => {
  assert.equal(assertOperational("alive").ok, true);
  assert.equal(assertOperational("dead").ok, false);
  assert.equal(assertOperational("hybernating").ok, false);
});

test("survivorConfig picks env overrides when set", () => {
  const orig = { ...process.env };
  process.env.SURVIVOR_STARTING_CAPITAL = "100";
  process.env.SURVIVOR_MAX_RISK_PERCENT = "15";
  try {
    const cfg = survivorConfig();
    assert.equal(cfg.startingCapital, 100);
    assert.equal(cfg.maxRiskPercent, 15);
  } finally {
    for (const k of Object.keys(orig)) process.env[k] = orig[k];
    for (const k of Object.keys(process.env)) if (!(k in orig)) delete process.env[k];
  }
});

test("risk cap vetoes otherwise-attractive bids", () => {
  // High value + low complexity but risk above the cap must be skipped.
  const opp = {
    id: "a",
    source: "sandbox",
    title: "Risky gig",
    description: null,
    service_category: "webdev",
    estimated_value: 40,
    complexity: "low" as const,
    risk_percent: 35,
    deadline_days: 20,
    active: true,
    created_at: new Date().toISOString(),
  };
  const scored = scoreOpportunity(opp, STRATEGY_PROFILES.balanced, CFG.maxRiskPercent, CFG.deadlinePenaltyDays);
  assert.equal(scored.verdict, "skip");
  assert.ok(scored.reasons.some((r) => r.includes("cap")));
});

test("aggressive profile bids on opportunities conservative skips", () => {
  const opp = {
    id: "b",
    source: "sandbox",
    title: "Medium stakes",
    description: null,
    service_category: "webdev",
    estimated_value: 22,
    complexity: "medium" as const,
    risk_percent: 9,
    deadline_days: 8,
    active: true,
    created_at: new Date().toISOString(),
  };
  const cons = scoreOpportunity(opp, STRATEGY_PROFILES.conservative, CFG.maxRiskPercent, CFG.deadlinePenaltyDays);
  const aggr = scoreOpportunity(opp, STRATEGY_PROFILES.aggressive, CFG.maxRiskPercent, CFG.deadlinePenaltyDays);
  assert.equal(cons.verdict, "skip");
  assert.equal(aggr.verdict, "bid");
  assert.ok(aggr.score > cons.score);
});

test("planProposals respects bidsPerRun minus pending", () => {
  const opps = allSandboxOpportunities();
  const plan = planProposals(opps, STRATEGY_PROFILES.balanced, CFG, 2);
  assert.ok(plan.bidsStaged.length <= CFG.bidsPerRun);
  assert.ok(plan.bidsStaged.length + plan.skipped.length === opps.length);
});

test("forward-looking bid slots shrink when proposals are pending", () => {
  const opps = allSandboxOpportunities();
  const full = planProposals(opps, STRATEGY_PROFILES.balanced, CFG, 0);
  const reduced = planProposals(opps, STRATEGY_PROFILES.balanced, CFG, 3);
  assert.ok(reduced.bidsStaged.length <= full.bidsStaged.length);
});

test("sandboxBatch returns bounded unique sandbox gigs", () => {
  const batch = sandboxBatch(CFG.opportunityBatch);
  assert.ok(batch.length > 0);
  assert.ok(batch.length <= CFG.opportunityBatch);
  assert.ok(batch.every((o) => o.source === "sandbox"));
  assert.ok(batch.every((o) => o.estimated_value > 0));
  assert.ok(new Set(batch.map((o) => o.id)).size === batch.length);
});

test("job lifecycle: won -> in_progress -> delivered -> paid with credit", () => {
  let job = {
    id: "j1", agent_id: "a", opportunity_id: null, proposal_id: null,
    title: "Gig", client: "c", value: 20, status: "won" as const, win_rate: 85,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
  let r = advanceJob(job);
  assert.equal(r.next.status, "in_progress");
  job = r.next as any;
  r = advanceJob(job);
  assert.equal(r.next.status, "delivered");
  job = r.next as any;
  r = advanceJob(job);
  assert.equal(r.next.status, "paid");
  assert.equal(r.credit, 20);
  assert.ok(r.memory && r.memory.includes("paid"));
});

test("job lifecycle: failed jobs are terminal", () => {
  const job = {
    id: "j2", agent_id: "a", opportunity_id: null, proposal_id: null,
    title: "Gig", client: "c", value: 20, status: "failed" as const, win_rate: 85,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
  const r = advanceJob(job);
  assert.equal(r.next.status, "failed");
  assert.equal(r.credit, undefined);
});

test("buildPaymentEntry credits correct amount and balance", () => {
  const job = {
    id: "j3", agent_id: "a", opportunity_id: null, proposal_id: null,
    title: "Gig", client: "c", value: 18, status: "paid" as const, win_rate: 85,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
  const entry = buildPaymentEntry("a", job, 23);
  assert.equal(entry.type, "payment");
  assert.equal(entry.amount, 18);
  assert.equal(entry.balance_after, 41);
});

test("buildPostmortem records lesson and safe delta", () => {
  const won = buildPostmortem({ id: "j", status: "paid", title: "Gig", value: 20, win_rate: 90 } as any, true);
  assert.equal(won.won, true);
  assert.equal(won.delta.riskTolerance, 0.02);
  const lost = buildPostmortem({ id: "j", status: "failed", title: "Gig", value: 20, win_rate: 90 } as any, false);
  assert.equal(lost.won, false);
  assert.equal(lost.delta.riskTolerance, -0.03);
});

test("applyGradient clamps params into [0,1]", () => {
  const params = { valueWeight: 0.3, deadlineWeight: 0.2, complexityWeight: 0.2, riskTolerance: 0.98, minScore: 40 };
  const out = applyGradient(params, { riskTolerance: 0.05 });
  assert.equal(out.riskTolerance, 1);
  assert.equal(out.valueWeight, 0.3);
  const low = applyGradient(params, { riskTolerance: -0.1 });
  assert.equal(low.riskTolerance, 0.88);
});