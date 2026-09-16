// AI Freelance Survivor — domain types shared across lib, APIs and views.

export type SurvivalState = "alive" | "hybernating" | "dead";

export type TxType = "deposit" | "spend" | "income" | "expense" | "payment";

export type Complexity = "low" | "medium" | "high";

export type StrategyProfile = "conservative" | "balanced" | "aggressive" | "entrepreneur";

export type ProposalDecision = "bid" | "skip";

export type JobStatus = "proposed" | "won" | "in_progress" | "delivered" | "paid" | "failed";

// ── Wallet / ledger ─────────────────────────────────────────────────────────

export interface SurvivorAgent {
  id: string;
  name: string;
  status: SurvivalState;
  created_at: string;
  updated_at: string;
}

export interface LedgerTransaction {
  id: string;
  agent_id: string;
  type: TxType;
  amount: number; // signed; credit > 0, debit < 0
  currency: string;
  description: string | null;
  reference_id: string;
  balance_after: number;
  created_at: string;
}

export interface WalletView {
  agentId: string;
  name: string;
  status: SurvivalState;
  balance: number;
  pendingBids: number; // sum of staged (unapproved) bid payload values
  reserved: number; // sum of approved-but-unpaid job values
  currency: string;
}

// ── Config ──────────────────────────────────────────────────────────────────

export interface SurvivorConfig {
  mode: "sandbox" | "real";
  requireHumanApproval: boolean;
  startingCapital: number;
  maxSingleExpense: number;
  maxDailyExpense: number;
  maxRiskPercent: number;
  minRunway: number; // below this balance the agent hybernates
  opportunityBatch: number; // opportunities generated per experiment run
  deadlinePenaltyDays: number; // jobs with fewer remaining days get a risk bump
  bidsPerRun: number; // max proposals staged per experiment run
}

// ── Opportunity / proposal / job ────────────────────────────────────────────

export interface Opportunity {
  id: string;
  source: string;
  title: string;
  description: string | null;
  service_category: string | null;
  estimated_value: number;
  complexity: Complexity;
  risk_percent: number;
  deadline_days: number;
  active: boolean;
  created_at: string;
}

export interface Proposal {
  id: string;
  agent_id: string;
  opportunity_id: string | null;
  source: string;
  score: number;
  decision: ProposalDecision;
  status: "proposed" | "approved" | "rejected" | "expired";
  rationale: string | null;
  approval_id: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  agent_id: string;
  opportunity_id: string | null;
  proposal_id: string | null;
  title: string;
  client: string | null;
  value: number;
  status: JobStatus;
  win_rate: number;
  created_at: string;
  updated_at: string;
}

// ── Memory / learning ───────────────────────────────────────────────────────

export type MemoryKind = "lesson" | "postmortem" | "fact";

export interface MemoryRecord {
  id: string;
  agent_id: string;
  kind: MemoryKind;
  content: string;
  source: string | null;
  confidence: number;
  created_at: string;
}

export interface StrategyParams {
  valueWeight: number; // 0..1 appetite for large payouts
  deadlineWeight: number; // 0..1 preference for fast completion
  complexityWeight: number; // 0..1 tolerance for hard work
  riskTolerance: number; // 0..1 tolerance for high risk
  minScore: number; // proposal gate
}

export interface Strategy {
  id: string;
  agent_id: string;
  profile: StrategyProfile;
  active: boolean;
  params: StrategyParams;
  created_at: string;
  updated_at: string;
}

// ── Experiments ─────────────────────────────────────────────────────────────

export interface Experiment {
  id: string;
  name: string;
  status: "running" | "complete" | "failed";
  started_at: string;
  finished_at: string | null;
  summary: string | null;
  created_at: string;
}

// ── Scored result ───────────────────────────────────────────────────────────

export interface ScoredOpportunity {
  opportunity: Opportunity;
  score: number; // 0..100
  verdict: "bid" | "skip";
  reasons: string[];
}