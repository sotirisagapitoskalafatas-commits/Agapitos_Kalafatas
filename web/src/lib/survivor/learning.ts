// Postmortem / learning: record lessons and adjust strategy params.
// Pure helpers; DB writes happen in server.ts.
import type { Job, MemoryRecord, StrategyParams } from "./types";

export interface Postmortem {
  jobId: string;
  won: boolean;
  value: number;
  lesson: string;
  // Small gradient to nudge weights.
  delta: Partial<StrategyParams>;
}

// Generate a postmortem from a completed job outcome.
export function buildPostmortem(job: Job, won: boolean): Postmortem {
  const base = won
    ? `Delivered successfully: ${job.title} (€${job.value}).`
    : `Failed to deliver: ${job.title}.`;

  const risk = job.win_rate;
  // After a loss, dampen risk appetite slightly; after a win, nudge it up a tiny bit.
  const delta: Partial<StrategyParams> = won
    ? { riskTolerance: 0.02, valueWeight: 0.01 }
    : { riskTolerance: -0.03, deadlineWeight: 0.01 };

  return {
    jobId: job.id,
    won,
    value: job.value,
    lesson: `${base} Win rate was ${risk}%.`,
    delta,
  };
}

// Apply gradient to params, clamping each to [0, 1].
export function applyGradient(params: StrategyParams, delta: Partial<StrategyParams>): StrategyParams {
  const clamp = (v: number) => Math.max(0, Math.min(1, Math.round(v * 100) / 100));
  return {
    ...params,
    valueWeight: clamp(params.valueWeight + (delta.valueWeight ?? 0)),
    deadlineWeight: clamp(params.deadlineWeight + (delta.deadlineWeight ?? 0)),
    complexityWeight: clamp(params.complexityWeight + (delta.complexityWeight ?? 0)),
    riskTolerance: clamp(params.riskTolerance + (delta.riskTolerance ?? 0)),
    minScore: Math.max(20, Math.min(80, params.minScore + (delta.minScore ?? 0))),
  };
}