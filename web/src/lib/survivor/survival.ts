// Survival state machine: ALIVE ↔ HYBERNATE ↔ DEAD
// "DEAD" is terminal for an experiment run; postmortem required.
import type { SurvivalState, SurvivorConfig } from "./types";

// Pure evaluator: given a current balance, decide the survival state.
// DEAD: cash <= 0.
// HYBERNATE: 0 < cash < minRunway (auto-hybernate; can be reactivated).
// ALIVE: cash >= minRunway.
export function decideSurvival(balance: number, config: SurvivorConfig): SurvivalState {
  const rounded = Math.round(balance * 100) / 100;
  if (rounded <= 0) return "dead";
  if (rounded < config.minRunway) return "hybernating";
  return "alive";
}

// Assert the agent can still operate. Throws on DEAD; returns a human-readable reason on hybernate.
export function assertOperational(state: SurvivalState): { ok: boolean; reason: string } {
  if (state === "dead") return { ok: false, reason: "Agent is DEAD: experiment frozen." };
  if (state === "hybernating")
    return {
      ok: false,
      reason: "Agent is HYBERNATING: balance below minimum runway. Wait for a deposit.",
    };
  return { ok: true, reason: "ALIVE" };
}