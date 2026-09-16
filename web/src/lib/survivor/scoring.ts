// Weighted scoring engine: profiles decide the risk appetite.
// Score is 0..100. A score >= minScore results in a BID verdict.
import type { Complexity, Opportunity, ScoredOpportunity, StrategyParams, StrategyProfile, SurvivorConfig } from "./types";

// Strategy presets (spec §17)
export const STRATEGY_PROFILES: Record<StrategyProfile, StrategyParams> = {
  conservative: {
    valueWeight: 0.25,
    deadlineWeight: 0.15,
    complexityWeight: 0.2,
    riskTolerance: 0.15,
    minScore: 70,
  },
  balanced: {
    valueWeight: 0.3,
    deadlineWeight: 0.2,
    complexityWeight: 0.2,
    riskTolerance: 0.2,
    minScore: 55,
  },
  aggressive: {
    valueWeight: 0.25,
    deadlineWeight: 0.25,
    complexityWeight: 0.15,
    riskTolerance: 0.3,
    minScore: 40,
  },
  entrepreneur: {
    valueWeight: 0.2,
    deadlineWeight: 0.25,
    complexityWeight: 0.25,
    riskTolerance: 0.3,
    minScore: 45,
  },
};

// Normalize a raw value into 0..1 range using min/max boundaries.
function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

// Map complexity to a 0..1 inverse-difficulty score (low complexity = 1.0).
function complexityScore(c: Complexity): number {
  switch (c) {
    case "low": return 1;
    case "medium": return 0.6;
    case "high": return 0.25;
  }
}

// Deadlines: fewer days = higher urgency bonus. But if fewer than deadlinePenaltyDays
// AND high risk, apply a risk penalty instead.
function deadlineScore(days: number, riskPercent: number, penaltyDays: number, maxRisk: number): number {
  if (days <= 0) return 0;
  const urgency = normalize(days, 30, 3); // 30 days → 0, 3 days → 1
  const riskPenalty =
    days <= penaltyDays && riskPercent > maxRisk ? (1 - riskPercent / 100) * 0.4 : 0;
  return Math.max(0, Math.min(1, urgency - riskPenalty));
}

export function scoreOpportunity(
  opp: Opportunity,
  params: StrategyParams,
  maxRisk: number,
  penaltyDays: number,
): ScoredOpportunity {
  const reasons: string[] = [];
  const valueNorm = normalize(opp.estimated_value, 0, 50); // cap at €50 for normalization
  const compNorm = complexityScore(opp.complexity);
  const deadlineNorm = deadlineScore(opp.deadline_days, opp.risk_percent, penaltyDays, maxRisk);
  const riskNorm = normalize(100 - opp.risk_percent, 0, 100); // low risk → high score

  const raw =
    valueNorm * params.valueWeight +
    deadlineNorm * params.deadlineWeight +
    compNorm * params.complexityWeight +
    riskNorm * params.riskTolerance;

  // Guardrail: hard-cap risk beyond maxRisk regardless of score
  if (opp.risk_percent > maxRisk) {
    reasons.push(`risk ${opp.risk_percent}% exceeds cap ${maxRisk}%`);
  }
  if (valueNorm < 0.1) reasons.push("low estimated value");
  if (opp.deadline_days <= 3) reasons.push("very tight deadline");

  const score = Math.round(raw * 100);
  const verdict = score >= params.minScore && opp.risk_percent <= maxRisk ? "bid" : "skip";

  if (verdict === "bid") reasons.push("score above threshold");
  else reasons.push("score below threshold or risk exceeded");

  return { opportunity: opp, score, verdict, reasons };
}

// ── Proposal planning (pure) ─────────────────────────────────────────────────

export interface ProposalPlan {
  scored: ScoredOpportunity[];
  bidsStaged: ScoredOpportunity[];
  skipped: ScoredOpportunity[];
}

// Score a batch of opportunities against the active profile and pick bids up to
// bidsPerRun minus the number already pending (staged, undecided).
export function planProposals(
  opportunities: Opportunity[],
  params: StrategyParams,
  config: SurvivorConfig,
  pendingBidCount: number,
): ProposalPlan {
  const scored = opportunities
    .map((o) => scoreOpportunity(o, params, config.maxRiskPercent, config.deadlinePenaltyDays))
    .sort((a, b) => b.score - a.score);

  const remainingSlots = Math.max(0, config.bidsPerRun - pendingBidCount);
  const bidsStaged: ScoredOpportunity[] = [];
  const skipped: ScoredOpportunity[] = [];

  for (const s of scored) {
    if (bidsStaged.length >= remainingSlots) {
      skipped.push(s);
      continue;
    }
    if (s.verdict === "bid") {
      bidsStaged.push(s);
    } else {
      skipped.push(s);
    }
  }

  return { scored, bidsStaged, skipped };
}