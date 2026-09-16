// Sandbox job simulation: advance jobs through a lifecycle and credit payment.
// Deterministic execution: 85% win rate (per spec §17), risk-adjusted delays.
import type { Job, JobStatus, LedgerTransaction, MemoryRecord, Opportunity } from "./types";

// Lifecycle transitions (sandbox execution engine).
const LIFECYCLE: JobStatus[] = ["won", "in_progress", "delivered", "paid"];

// Simulate a single job lifecycle step based on its current status.
export function advanceJob(job: Job, winRate = 85): { next: Job; credit?: number; memory?: string } {
  const rng = Math.random() * 100;
  const idx = LIFECYCLE.indexOf(job.status);

  if (idx === -1 || job.status === "paid" || job.status === "failed") {
    return { next: job }; // terminal
  }

  if (job.status === "won") {
    // Begin work.
    return {
      next: { ...job, status: "in_progress", updated_at: new Date().toISOString() },
    };
  }

  if (job.status === "in_progress") {
    // Delivered, or failed based on risk and random chance.
    const failChance = job.win_rate < winRate ? 10 : 15;
    if (rng > 100 - failChance) {
      return {
        next: { ...job, status: "failed", updated_at: new Date().toISOString() },
        memory: `Job failed: ${job.title} — likely deadline pressure or scope creep.`,
      };
    }
    return {
      next: { ...job, status: "delivered", updated_at: new Date().toISOString() },
    };
  }

  if (job.status === "delivered") {
    // Payment received — credit the wallet.
    return {
      next: { ...job, status: "paid", updated_at: new Date().toISOString() },
      credit: job.value,
      memory: `Job paid: ${job.title} — earned €${job.value}.`,
    };
  }

  return { next: job };
}

// Build a ledger entry for a successful payment.
export function buildPaymentEntry(
  agentId: string,
  job: Job,
  balanceBefore: number,
): Omit<LedgerTransaction, "id" | "created_at"> {
  const credit = job.value;
  return {
    agent_id: agentId,
    type: "payment",
    amount: credit,
    currency: "EUR",
    description: `Sandbox payment: ${job.title}`,
    reference_id: `job:${job.id}:payment`,
    balance_after: Math.round((balanceBefore + credit) * 100) / 100,
  };
}