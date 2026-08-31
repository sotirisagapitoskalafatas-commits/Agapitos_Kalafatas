// Small Business Plugin — command registry.
//
// Every `/command` the plugin ships, grouped by the part of the business week it
// takes over. Commands carry metadata (category, summary, help, which connectors
// they need, whether they write/approve) so the UI can render the full menu and
// the orchestrator can route + gate each one.

import type { ConnectorId } from "./connectors";

export type CommandCategory =
  | "money"
  | "sales"
  | "customers"
  | "marketing"
  | "week"
  | "paperwork";

export interface CommandMeta {
  id: string;                 // e.g. "invoice-chase"
  slug: string;               // "/invoice-chase"
  name: string;
  category: CommandCategory;
  summary: string;            // one-liner for the menu
  help: string;               // longer detail / walkthrough
  connectors: ConnectorId[];  // tools it reads from
  write: boolean;             // true => stages approval-gated writes
  implements: "node" | "skeleton"; // "node" = real handler, "skeleton" = menu only
}

export const CATEGORY_LABEL: Record<CommandCategory, string> = {
  money: "Money & Finance",
  sales: "Sales & Pipeline",
  customers: "Customers",
  marketing: "Marketing",
  week: "Your Week On Autopilot",
  paperwork: "Paperwork & People",
};

export const COMMANDS: CommandMeta[] = [
  // ── Money ──
  { id: "invoice-chase", slug: "/invoice-chase", name: "Invoice Chase", category: "money", summary: "Find unpaid invoices and draft a personalized follow-up per client.", help: "Fetches overdue invoices, matches each client's payment history, drafts reminders staged for your approval. You are always the last click before anything sends.", connectors: ["quickbooks", "stripe", "paypal", "gmail"], write: true, implements: "node" },
  { id: "close-month", slug: "/close-month", name: "Close the Month", category: "money", summary: "Reconcile books vs payments and write the P&L story.", help: "Pulls invoices + settlements and produces a reconciliation summary and month narrative.", connectors: ["quickbooks", "stripe"], write: false, implements: "skeleton" },
  { id: "cash-flow-snapshot", slug: "/cash-flow-snapshot", name: "Cash Flow Snapshot", category: "money", summary: "30/60/90-day cash forecast with risk flags.", help: "Forecasts expected cash by bucket and flags slippage or shortfalls.", connectors: ["quickbooks", "stripe"], write: false, implements: "skeleton" },
  { id: "plan-payroll", slug: "/plan-payroll", name: "Plan Payroll", category: "money", summary: "Check you can make payroll; chase what is owed.", help: "Compares expected cash against upcoming payroll obligations.", connectors: ["quickbooks", "stripe"], write: true, implements: "skeleton" },
  { id: "month-heads-up", slug: "/month-heads-up", name: "Month Heads-up", category: "money", summary: "Run on the 25th: what needs attention pre-close.", help: "Pre-close runway of invoices, reconciliations and flagged items before month end.", connectors: ["quickbooks"], write: false, implements: "skeleton" },
  { id: "tax-prep", slug: "/tax-prep", name: "Tax Prep", category: "money", summary: "Quarterly estimates or year-end 1099 prep packet.", help: "Collects the documents and figures needed for estimates or 1099 prep.", connectors: ["quickbooks", "gmail"], write: true, implements: "skeleton" },

  // ── Sales & Pipeline ──
  { id: "lead-triage", slug: "/lead-triage", name: "Lead Triage", category: "sales", summary: "Score your leads: call these 5 today, with talking points.", help: "Pulls new leads, scores hot/warm/cold, and returns the top 5 to call with talking points.", connectors: ["hubspot"], write: false, implements: "node" },
  { id: "call-list", slug: "/call-list", name: "Call List", category: "sales", summary: "Top leads worth calling; blocks time on your calendar.", help: "Builds a call list and proposes calendar blocks for outreach.", connectors: ["hubspot", "calendar"], write: true, implements: "skeleton" },
  { id: "crm-cleanup", slug: "/crm-cleanup", name: "CRM Cleanup", category: "sales", summary: "Fix stale deals, duplicates, missing fields in HubSpot.", help: "Identifies stale/duplicate records and stages corrections for approval.", connectors: ["hubspot"], write: true, implements: "skeleton" },
  { id: "crm-maintenance", slug: "/crm-maintenance", name: "CRM Maintenance", category: "sales", summary: "Log calls and update records so you don't.", help: "Drafts call logs and record updates from recent activity.", connectors: ["hubspot", "gmail"], write: true, implements: "skeleton" },

  // ── Customers ──
  { id: "customer-pulse", slug: "/customer-pulse", name: "Customer Pulse", category: "customers", summary: "What customers are saying across disputes and reviews.", help: "Aggregates disputes, support tickets and communications into sentiment.", connectors: ["stripe", "hubspot", "gmail"], write: false, implements: "skeleton" },
  { id: "handle-complaint", slug: "/handle-complaint", name: "Handle Complaint", category: "customers", summary: "Pull context, draft the response, suggest the fix.", help: "Gathers the thread + order/invoice context and drafts a resolution reply.", connectors: ["gmail", "hubspot", "stripe"], write: true, implements: "skeleton" },
  { id: "ticket-deflector", slug: "/ticket-deflector", name: "Ticket Deflector", category: "customers", summary: "Answer 'where is my order' emails in your voice.", help: "Drafts replies to common support emails using your tone.", connectors: ["gmail", "stripe"], write: true, implements: "skeleton" },

  // ── Marketing ──
  { id: "sales-brief", slug: "/sales-brief", name: "Sales Brief", category: "marketing", summary: "Top and bottom sellers plus a 2-week content brief.", help: "Analyzes sales by product and proposes a content plan.", connectors: ["stripe", "hubspot"], write: false, implements: "skeleton" },
  { id: "content-strategy", slug: "/content-strategy", name: "Content Strategy", category: "marketing", summary: "30-day plan: what to push, what offers to run.", help: "Builds a calendar of content and offers from recent performance.", connectors: ["hubspot", "canva"], write: false, implements: "skeleton" },
  { id: "run-campaign", slug: "/run-campaign", name: "Run Campaign", category: "marketing", summary: "Full campaign: analysis, brief, Canva assets, send.", help: "End-to-end campaign: brief, assets, and staged send.", connectors: ["hubspot", "canva", "gmail"], write: true, implements: "skeleton" },
  { id: "price-check", slug: "/price-check", name: "Price Check", category: "marketing", summary: "Margin by product and pricing scenarios.", help: "Estimates gross margin and tests pricing scenarios.", connectors: ["quickbooks", "stripe"], write: false, implements: "skeleton" },

  // ── Your Week On Autopilot ──
  { id: "monday-brief", slug: "/monday-brief", name: "Monday Brief", category: "week", summary: "One page: cash, sales, pipeline, top 3 to-dos.", help: "Read-only executive snapshot across finance, sales and ops. Safe to run every Monday.", connectors: ["quickbooks", "stripe", "hubspot", "calendar", "docusign"], write: false, implements: "node" },
  { id: "friday-brief", slug: "/friday-brief", name: "Friday Brief", category: "week", summary: "End-of-week pulse: revenue vs last week, wins, watches.", help: "Week-over-week revenue, wins, and watch items.", connectors: ["quickbooks", "stripe", "hubspot"], write: false, implements: "skeleton" },
  { id: "business-pulse", slug: "/business-pulse", name: "Business Pulse", category: "week", summary: "The full snapshot any time you ask 'catch me up'.", help: "On-demand version of the Monday brief.", connectors: ["quickbooks", "hubspot"], write: false, implements: "skeleton" },
  { id: "quarterly-review", slug: "/quarterly-review", name: "Quarterly Review", category: "week", summary: "Presentation-ready QBR of the whole quarter.", help: "Aggregates the quarter into a QBR summary.", connectors: ["quickbooks", "hubspot", "stripe"], write: false, implements: "skeleton" },

  // ── Paperwork & People ──
  { id: "review-contract", slug: "/review-contract", name: "Review Contract", category: "paperwork", summary: "Plain-English contract review with red flags + redlines.", help: "Analyzes a contract and flags risks/references for counsel.", connectors: ["docusign"], write: false, implements: "skeleton" },
  { id: "job-post-builder", slug: "/job-post-builder", name: "Job Post Builder", category: "paperwork", summary: "Job post, interview guide, scoring rubric, offer letter.", help: "Builds hiring artifacts from a role description.", connectors: [], write: true, implements: "skeleton" },
  { id: "smb-onboard", slug: "/smb-onboard", name: "SMB Onboard", category: "paperwork", summary: "The built-in trainer: start here.", help: "Connects your first two tools and interviews you about your business.", connectors: ["quickbooks", "stripe"], write: true, implements: "skeleton" },
];

export const COMMAND_BY_ID: Record<string, CommandMeta> = Object.fromEntries(
  COMMANDS.map((c) => [c.id, c])
);

export function findCommand(raw: string): CommandMeta | null {
  const clean = raw.trim().toLowerCase();
  // accept "/invoice-chase", "invoice-chase", "invoice chase", partial intents
  const bySlug = COMMANDS.find(
    (c) => clean === c.slug || clean === c.id || clean === c.id.replace("-", " ")
  );
  if (bySlug) return bySlug;
  const byToken = COMMANDS.find((c) => c.id.split("-").every((tok) => clean.includes(tok)));
  return byToken || null;
}

export function commandsByCategory(): Record<CommandCategory, CommandMeta[]> {
  const out = {} as Record<CommandCategory, CommandMeta[]>;
  for (const c of COMMANDS) (out[c.category] = out[c.category] || []).push(c);
  return out;
}
