// Sandbox opportunity source: deterministic pool of Greek tech gigs.
// In sandbox mode, the agent sees realistic but synthetic work.
import type { Complexity, Opportunity } from "./types";

// Curated sandbox gigs (spec §7: realistic projects, honest delivery, never fabricated results).
const SANDBOX_POOL: Array<Omit<Opportunity, "id" | "source" | "active" | "created_at">> = [
  {
    title: "Site modernization: WordPress → Next.js",
    description: "Migrate a Greek SMB's WordPress shop to a modern headless stack. Realism check: scope includes content audit.",
    service_category: "webdev",
    estimated_value: 28,
    complexity: "high",
    risk_percent: 8,
    deadline_days: 18,
  },
  {
    title: "Energy bill PDFs → CSV extraction",
    description: "Parse two years of ΔΕΔΔΗΕ energy bills into a normalized CSV for the accountant.",
    service_category: "energy",
    estimated_value: 14,
    complexity: "low",
    risk_percent: 4,
    deadline_days: 5,
  },
  {
    title: "Photovoltaic system ROI calculator",
    description: "Build an interactive ROI tool for a residential PV proposal. Greek utility rates, daylight hours, and net-metering logic.",
    service_category: "webdev",
    estimated_value: 22,
    complexity: "medium",
    risk_percent: 6,
    deadline_days: 10,
  },
  {
    title: "Automated policy renewal reminder (SMS/Email)",
    description: "Set up the CRM to send 7-day and 1-day reminders before an insurance policy renewal date.",
    service_category: "insurance",
    estimated_value: 18,
    complexity: "medium",
    risk_percent: 5,
    deadline_days: 12,
  },
  {
    title: "Greek-focused landing page copywriting",
    description: "Write two A/B variants of a homepage hero + CTA for an Athens energy startup. Greek language only.",
    service_category: "marketing",
    estimated_value: 10,
    complexity: "low",
    risk_percent: 3,
    deadline_days: 4,
  },
  {
    title: "Customer churn risk dashboard",
    description: "Build a small internal dashboard pulling from the CRM to visualize at-risk accounts.",
    service_category: "webdev",
    estimated_value: 25,
    complexity: "high",
    risk_percent: 9,
    deadline_days: 15,
  },
  {
    title: "Stripe payment integration (sandbox → production ready)",
    description: "Add Stripe checkout to a Next.js app. Includes Greece VAT calculation and receipt email.",
    service_category: "webdev",
    estimated_value: 30,
    complexity: "high",
    risk_percent: 7,
    deadline_days: 14,
  },
  {
    title: "Insurance lead scoring model",
    description: "Train a simple rules-based lead scoring model from existing CRM data. Exportable to CSV.",
    service_category: "insurance",
    estimated_value: 20,
    complexity: "medium",
    risk_percent: 5,
    deadline_days: 8,
  },
  {
    title: "Social media content calendar template",
    description: "Create a Notion/Google Sheets content calendar template tailored for a Greek energy brand.",
    service_category: "marketing",
    estimated_value: 12,
    complexity: "low",
    risk_percent: 2,
    deadline_days: 5,
  },
  {
    title: "Real-time energy usage dashboard prototype",
    description: "Connect to a mock WebSocket stream and visualize hourly kWh usage with peak/off-peak cost overlay.",
    service_category: "webdev",
    estimated_value: 26,
    complexity: "high",
    risk_percent: 10,
    deadline_days: 11,
  },
  {
    title: "Greek translation of a SaaS product guide",
    description: "Translate a 15-page English product manual into Greek. No localization, just a clean translation.",
    service_category: "marketing",
    estimated_value: 11,
    complexity: "low",
    risk_percent: 2,
    deadline_days: 6,
  },
  {
    title: "Renewable energy certificate verification script",
    description: "A small Node script that checks a PDF for a valid energy certificate number against the official registry.",
    service_category: "energy",
    estimated_value: 16,
    complexity: "medium",
    risk_percent: 6,
    deadline_days: 9,
  },
];

// Deterministic pseudo-random pick (seeded by current minute — good enough for sandbox variety).
export function sandboxBatch(batchSize: number): Opportunity[] {
  const now = Date.now();
  const bucket = Math.floor(now / (60 * 1000)) % SANDBOX_POOL.length;
  const picked: Opportunity[] = [];
  for (let i = 0; i < Math.min(batchSize, SANDBOX_POOL.length); i++) {
    const src = SANDBOX_POOL[(bucket + i) % SANDBOX_POOL.length];
    picked.push({
      id: `sbx-${bucket + i}-${(now % 10000).toString(36)}`,
      source: "sandbox",
      active: true,
      created_at: new Date(now).toISOString(),
      ...src,
    });
  }
  return picked;
}

export function allSandboxOpportunities(): Opportunity[] {
  return SANDBOX_POOL.map((src, i) => ({
    id: `sbx-all-${i}`,
    source: "sandbox",
    active: true,
    created_at: new Date().toISOString(),
    ...src,
  }));
}