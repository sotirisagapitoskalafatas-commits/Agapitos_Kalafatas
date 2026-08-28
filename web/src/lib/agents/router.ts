// Task router: classifies request complexity + risk into a model tier.
import type { Tier } from "./types";

const HIGH_RISK = [
  "gdpr", "personal data", "delete", "send", "payment", "contract",
  "legal", "medical", "financial", "encrypt", "client", "customer",
  "email", "whatsapp", "sms", "publish", "charge",
];

const COMPLEX_ACTIONS = [
  "analyze", "compare", "design", "plan", "debug", "architect",
  "investigate", "research", "optimize", "evaluate", "forecast",
  "build", "create", "implement",
];

const SIMPLE_ACTIONS = [
  "extract", "classify", "format", "translate", "summarize",
  "calculate", "convert", "list", "search",
];

export function decideTier(prompt: string): { tier: Tier; risk: boolean; reason: string } {
  const text = prompt.toLowerCase();
  const words = text.split(/\s+/);

  const riskHits = HIGH_RISK.filter((t) => text.includes(t)).length;
  const complexHits = COMPLEX_ACTIONS.filter((t) => text.includes(t)).length;
  const simpleHits = SIMPLE_ACTIONS.filter((t) => text.includes(t)).length;

  const multipart = [" and ", " then ", " after ", " step ", " first ", " also "]
    .filter((m) => text.includes(m)).length;

  if (riskHits > 0) {
    return { tier: "large", risk: true, reason: "High-risk or sensitive-data task" };
  }
  if (complexHits >= 2 || multipart >= 2 || words.length > 120) {
    return { tier: "large", risk: false, reason: "Multi-step or high-complexity task" };
  }
  if (complexHits === 1 || words.length > 40) {
    return { tier: "medium", risk: false, reason: "Moderate reasoning likely required" };
  }
  if (simpleHits > 0) {
    return { tier: "small", risk: false, reason: "Simple deterministic task" };
  }
  return { tier: "medium", risk: false, reason: "Unknown task; safe default" };
}
