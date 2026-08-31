// Small Business Plugin — command orchestrator.
//
// Dispatches a slash command to its node handler. Commands marked `implements:
// "node"` have real logic here; the rest fall through to a generic skeleton that
// explains the command and reports connector readiness.
//
// HITL model (reused from lib/agents/approvals): the agent READS real/stub data
// and DRAFTS; it never sends or mutates. Money/outbound actions are staged as
// pending approvals the admin reviews, exactly like the existing orchestrator.

import { proposeAction } from "@/lib/agents/approvals";
import type { AgentContext } from "@/lib/agents/types";
import { getConnector, missingConnectors, type ConnectorId } from "./connectors";
import { findCommand, CATEGORY_LABEL, COMMANDS, type CommandMeta } from "./commands";

export interface CommandResult {
  ok: boolean;
  command: string;
  response: string;
  staged: { count: number; actionType: string; approvalIds: string[] };
  connectorsMissing: ConnectorId[];
  // Enables the UI to render the full plugin menu without running a command.
  menu?: ReturnType<typeof buildMenuText>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtMoney(n: number): string {
  return "€" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function read(connector: ConnectorId, kind: string) {
  return (await getConnector(connector)).read(kind);
}

// ---------------------------------------------------------------------------
// Node: /monday-brief  (read-only executive snapshot)
// ---------------------------------------------------------------------------
async function runMondayBrief(ctx: AgentContext): Promise<CommandResult> {
  const qb = await read("quickbooks", "invoices");
  const cash = await read("quickbooks", "cashflow");
  const deals = await read("hubspot", "deals");
  const leads = await read("hubspot", "leads");
  const tasks = await read("calendar", "tasks");
  const contracts = await read("docusign", "contracts");

  const overdue = qb.items.filter((i) => (i.daysLate || 0) > 0);
  const overdueTotal = overdue.reduce((s, i) => s + (i.amount || 0), 0);
  const openValue = deals.items.reduce((s, d) => s + (d.value || 0), 0);
  const topTasks = tasks.items.slice(0, 3);

  const lines: string[] = [];
  lines.push(`## 📊 Monday Executive Brief`);
  lines.push("");
  lines.push(`**Cash forecast (30/60/90):** ${cash.items.map((b) => `${b.bucket} ${fmtMoney(b.expected)}`).join(" · ")}`);
  const flagged = cash.items.filter((b) => b.flagged);
  if (flagged.length) lines.push(`⚠️ Risk flags: ${flagged.map((b) => b.note).join("; ")}`);
  lines.push("");
  lines.push(`**Pipeline:** ${deals.items.length} active deals worth ${fmtMoney(openValue)}. Top: ${deals.items[0]?.deal} (${deals.items[0]?.stage}).`);
  lines.push(`**New leads:** ${leads.items.length} wait for triage — run \`/lead-triage\`.`);
  lines.push(`**Overdue receivables:** ${overdue.length} invoices, ${fmtMoney(overdueTotal)} total — run \`/invoice-chase\`.`);
  lines.push("");
  lines.push(`**Top to-dos:**`);
  topTasks.forEach((t, i) => lines.push(`${i + 1}. ${t.title} (${t.priority}, due ${t.due})`));
  const sig = contracts.items.filter((c) => c.status === "awaiting_signature");
  if (sig.length) lines.push(`**Needs your signature:** ${sig.map((c) => c.title).join(", ")}.`);
  lines.push("");
  lines.push(`_Sample data — connect QuickBooks/Stripe/HubSpot to see your real numbers._`);

  return {
    ok: true,
    command: "/monday-brief",
    response: lines.join("\n"),
    staged: { count: 0, actionType: "", approvalIds: [] },
    connectorsMissing: missingConnectors(["quickbooks", "stripe", "hubspot", "calendar", "docusign"]),
  };
}

// ---------------------------------------------------------------------------
// Node: /invoice-chase  (read + draft, stage approvals for send)
// ---------------------------------------------------------------------------
async function runInvoiceChase(ctx: AgentContext): Promise<CommandResult> {
  const invoices = (await read("quickbooks", "invoices")).items;
  const settlements = (await read("stripe", "settlements")).items;

  // Skip clients who already paid today (avoid embarrassing nudge)
  const paidToday = new Set(settlements.map((s) => s.client));
  const open = invoices.filter((i) => (i.daysLate || 0) > 0 && !paidToday.has(i.client));

  const ok = open.filter((i) => i.daysLate <= 15);
  const firm = open.filter((i) => i.daysLate > 30);
  const mid = open.filter((i) => i.daysLate > 15 && i.daysLate <= 30).sort((a, b) => b.daysLate - a.daysLate);

  const draftFor = (inv: any): { subject: string; body: string } => {
    if (inv.daysLate > 30) {
      return {
        subject: `URGENT: Invoice ${inv.invoice} is overdue`,
        body: `Hi ${inv.client}, this is a final reminder that Invoice ${inv.invoice} (${fmtMoney(inv.amount)}) is now ${inv.daysLate} days overdue. Please remit payment or let us know if there is a query, as late fees may now apply.`,
      };
    }
    if (inv.daysLate > 15) {
      return {
        subject: `Friendly reminder: Invoice ${inv.invoice}`,
        body: `Hi ${inv.client}, just a gentle nudge that Invoice ${inv.invoice} (${fmtMoney(inv.amount)}) is now ${inv.daysLate} days overdue. Please let us know if you'd like to arrange payment.`,
      };
    }
    return {
      subject: `Quick nudge: Invoice ${inv.invoice}`,
      body: `Hi ${inv.client}, checking in on Invoice ${inv.invoice} (${fmtMoney(inv.amount)}). Happy to help if you have any questions — thanks!`,
    };
  };

  const approvalIds: string[] = [];
  for (const inv of [...ok, ...mid, ...firm]) {
    const draft = draftFor(inv);
    try {
      const res = await proposeAction(ctx, {
        actionType: "send_email",
        payload: { to: inv.email, subject: draft.subject, html: `<p>${draft.body}</p>` },
        summary: `Invoice #${inv.invoice} (${inv.client}) — ${inv.daysLate}d overdue, ${fmtMoney(inv.amount)}`,
      });
      approvalIds.push(res.approvalId);
    } catch {
      // non-fatal: keep the rest of the pipeline
    }
  }

  const lines: string[] = [];
  lines.push(`## 💸 Invoice Chase`);
  lines.push("");
  lines.push(`Pulled **${open.length}** overdue unpaid invoices and drafted follow-ups.`);
  lines.push(`- Gentle (≤15d late): ${ok.length}   ·   Firm (15–30d): ${mid.length}   ·   Urgent (>30d): ${firm.length}`);
  if (paidToday.size) lines.push(`Skipped ${paidToday.size} client(s) who already paid today (no embarrassing nudge).`);
  lines.push("");
  lines.push(`Drafts are staged in your **approval queue** — review and approve there to send.`);
  lines.push(`Staged for approval: **${approvalIds.length}** email(s).`);
  lines.push("");
  lines.push(approvalIds.length
    ? `_Nothing has been sent. You are always the last click._`
    : `No staged drafts (no overdue invoices or already handled).`);

  return {
    ok: true,
    command: "/invoice-chase",
    response: lines.join("\n"),
    staged: { count: approvalIds.length, actionType: "send_email", approvalIds },
    connectorsMissing: missingConnectors(["quickbooks", "stripe", "gmail"]),
  };
}

// ---------------------------------------------------------------------------
// Node: /lead-triage  (read-only scoring)
// ---------------------------------------------------------------------------
async function runLeadTriage(ctx: AgentContext): Promise<CommandResult> {
  const leads = (await read("hubspot", "leads")).items;

  const score = (l: any): "hot" | "warm" | "cold" => {
    const emailOk = /@(?!gmail|hotmail|yahoo|outlook)/.test(l.email || "");
    const hasUrgency = (l.comments || "").length > 20;
    if ((emailOk || (l.comments || "").includes("urgent")) && hasUrgency) return "hot";
    if (l.phone && l.phone.length >= 10) return "warm";
    return "cold";
  };

  const labeled: Array<Record<string, any> & { tier: "hot" | "warm" | "cold" }> = leads.map(
    (l) => ({ ...(l as Record<string, any>), tier: score(l) })
  );
  const hot = labeled.filter((l) => l.tier === "hot");
  const warm = labeled.filter((l) => l.tier === "warm");
  const cold = labeled.filter((l) => l.tier === "cold");
  const top5 = [...hot, ...warm].slice(0, 5);

  const lines: string[] = [];
  lines.push(`## 📞 Lead Triage`);
  lines.push("");
  lines.push(`Scored **${labeled.length}** lead(s): ${hot.length} hot · ${warm.length} warm · ${cold.length} cold.`);
  lines.push("");
  lines.push(`**Call these today:**`);
  if (top5.length === 0) lines.push("No hot/warm leads right now.");
  top5.forEach((l, i) => {
    lines.push(`${i + 1}. **${l.name}** (${l.email}) — ${l.serviceCategory}`);
    const point = l.comments?.includes("urgent") || (l.comments?.length || 0) > 20
      ? `Lead mentioned: "${l.comments}"`
      : `Lead asked about ${l.serviceCategory}. Open with a relevant value point.`;
    lines.push(`   ↳ ${point}`);
  });
  lines.push("");
  if (cold.length) lines.push(`Marked cold (thin contact data, may want cleanup): ${cold.map((c) => c.name).join(", ")}.`);

  return {
    ok: true,
    command: "/lead-triage",
    response: lines.join("\n"),
    staged: { count: 0, actionType: "", approvalIds: [] },
    connectorsMissing: missingConnectors(["hubspot"]),
  };
}

// ---------------------------------------------------------------------------
// Generic skeleton for commands not yet wired to a node
// ---------------------------------------------------------------------------
async function runSkeleton(ctx: AgentContext, cmd: CommandMeta): Promise<CommandResult> {
  const missing = missingConnectors(cmd.connectors);
  const lines: string[] = [];
  lines.push(`## ${cmd.slug} — ${cmd.name}`);
  lines.push(`*${CATEGORY_LABEL[cmd.category]}*`);
  lines.push("");
  lines.push(cmd.help);
  lines.push("");
  if (cmd.connectors.length) lines.push(`Connectors: ${cmd.connectors.join(", ")}.`);
  lines.push(missing.length
    ? `_This command needs more connectors connected (missing: ${missing.join(", ")})._`
    : `_Ready — this command is available._`);
  lines.push(`_This command is part of the plugin menu; run \`/monday-brief\`, \`/invoice-chase\` or \`/lead-triage\` for a fully wired walkthrough._`);

  return {
    ok: true,
    command: cmd.slug,
    response: lines.join("\n"),
    staged: { count: 0, actionType: "", approvalIds: [] },
    connectorsMissing: missing,
  };
}

// ---------------------------------------------------------------------------
// Menu text (for the UI to show the full plugin menu)
// ---------------------------------------------------------------------------
export function buildMenuText(): string {
  const lines: string[] = ["## 🧰 Small Business Plugin — Command Menu", ""];
  const order: (keyof typeof CATEGORY_LABEL)[] = ["money", "sales", "customers", "marketing", "week", "paperwork"];
  for (const cat of order) {
    lines.push(`**${CATEGORY_LABEL[cat]}**`);
    for (const c of COMMANDS.filter((x) => x.category === cat)) {
      lines.push(`- \`${c.slug}\` — ${c.summary}`);
    }
    lines.push("");
  }
  lines.push(`_${COMMANDS.length} commands total. Type a slash command to run one._`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
export async function runCommand(
  context: AgentContext,
  rawCommand: string
): Promise<CommandResult> {
  const cmd = findCommand(rawCommand);

  if (!cmd) {
    return {
      ok: false,
      command: rawCommand,
      response: `I couldn't find a matching command for \`${rawCommand}\`.\n\nTry one of these:\n${buildMenuText()}`,
      staged: { count: 0, actionType: "", approvalIds: [] },
      connectorsMissing: [],
      menu: buildMenuText(),
    };
  }

  try {
    switch (cmd.id) {
      case "monday-brief":
        return await runMondayBrief(context);
      case "invoice-chase":
        return await runInvoiceChase(context);
      case "lead-triage":
        return await runLeadTriage(context);
      default:
        return await runSkeleton(context, cmd);
    }
  } catch (e: any) {
    return {
      ok: false,
      command: cmd.slug,
      response: `The \`${cmd.slug}\` command hit an error: ${e.message}`,
      staged: { count: 0, actionType: "", approvalIds: [] },
      connectorsMissing: missingConnectors(cmd.connectors),
    };
  }
}
