// Survivor configuration: env-driven with sandbox-safe defaults.
// Never widen limits in "real" mode below these floors.
import type { SurvivorConfig } from "./types";

function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// All enforcement lives in the ledger; config only carries limits.
export const DEFAULT_CONFIG: Required<SurvivorConfig> = {
  mode: "sandbox",
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

export function survivorConfig(): SurvivorConfig {
  const mode = process.env.SURVIVOR_MODE === "real" ? "real" : "sandbox";
  return {
    mode,
    requireHumanApproval: process.env.SURVIVOR_REQUIRE_HUMAN_APPROVAL !== "false",
    startingCapital: num(process.env.SURVIVOR_STARTING_CAPITAL, DEFAULT_CONFIG.startingCapital),
    maxSingleExpense: num(process.env.SURVIVOR_MAX_SINGLE_EXPENSE, DEFAULT_CONFIG.maxSingleExpense),
    maxDailyExpense: num(process.env.SURVIVOR_MAX_DAILY_EXPENSE, DEFAULT_CONFIG.maxDailyExpense),
    maxRiskPercent: num(process.env.SURVIVOR_MAX_RISK_PERCENT, DEFAULT_CONFIG.maxRiskPercent),
    minRunway: num(process.env.SURVIVOR_MIN_RUNWAY, DEFAULT_CONFIG.minRunway),
    opportunityBatch: num(process.env.SURVIVOR_OPPORTUNITY_BATCH, DEFAULT_CONFIG.opportunityBatch),
    deadlinePenaltyDays: num(process.env.SURVIVOR_DEADLINE_PENALTY_DAYS, DEFAULT_CONFIG.deadlinePenaltyDays),
    bidsPerRun: num(process.env.SURVIVOR_BIDS_PER_RUN, DEFAULT_CONFIG.bidsPerRun),
  };
}

export function assertSafeLimits(cfg: SurvivorConfig): void {
  if (cfg.mode === "real") {
    // Hard floors even in real mode: never allow unbounded risk.
    if (cfg.maxSingleExpense > 1000)
      throw new Error("maxSingleExpense exceeds hard ceiling (1000)");
    if (cfg.maxDailyExpense > 2000)
      throw new Error("maxDailyExpense exceeds hard ceiling (2000)");
    if (cfg.maxRiskPercent > 50)
      throw new Error("maxRiskPercent exceeds hard ceiling (50)");
  }
}