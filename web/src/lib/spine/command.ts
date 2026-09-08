// ─── Command Center + My Attention aggregation (pure, testable) ──────────────
//
// Turns raw CRM rows into ONE honest view:
//   * attention  – ranked, rule-based items that need a human
//   * vitals     – real counts/amounts by domain (leads, pipeline, renewals,
//                  finance, operations, AI, comms)
//   * risk       – the top critical/high reasons right now
//   * jarvis     – a TRUTHFUL "foundation ready" card. No model output is
//                  invented here; suggestions are deterministic rules over the
//                  same rows, and the UI states that orchestration is disabled.
//
// Rules never fabricate data: every number comes from the input rows.

export type Severity = "critical" | "high" | "medium" | "low";

export interface AttentionAction {
  label: string;
  kind: "tab" | "href";
  target: string; // CRM tab name or absolute /admin/... path
}

export interface AttentionItem {
  id: string;
  kind: string;
  severity: Severity;
  title: string;
  entity: string;
  entityId: string | null;
  reason: string;
  timestamp: string | null;
  owner: string | null;
  actions: AttentionAction[];
}

export interface LeadRow {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  client_name: string | null;
  email: string | null;
  status: string | null;
  service_category: string | null;
  source: string | null;
  created_at: string;
  updated_at: string | null;
  renewal_date: string | null;
  provider: string | null;
  assigned_agent: string | null;
}

export interface TaskRow {
  id: string;
  title: string;
  event_type: string | null;
  start_time: string | null;
  end_time: string | null;
  completed: boolean | null;
  lead_id: string | null;
}

export interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  type: string | null;
  status: string | null;
  total: number | null;
  created_at: string;
  paid_at: string | null;
}

export interface CommunicationRow {
  id: string;
  lead_id: string | null;
  comm_type: string | null;
  direction: string | null;
  created_at: string;
}

export interface ApprovalRow {
  id: string;
  agent_name: string | null;
  action_type: string | null;
  summary: string | null;
  status: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface AgentRunRow {
  id: number;
  agent_name: string | null;
  output_summary: string | null;
  tier: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  type: string | null;
  status: string | null;
  message: string | null;
  created_at: string | null;
}

export interface CreativeRunRow {
  id: string;
  kind: string | null;
  status: string | null;
  result: unknown;
  created_at: string;
}

export interface ActivityRow {
  id: string;
  entity_type: string | null;
  action: string | null;
  details: unknown;
  created_at: string;
}

export interface DealRow {
  id: string;
  stage: string | null;
  value: number | null;
  currency: string | null;
  created_at: string;
}

export interface CommandCenterInput {
  leads: LeadRow[];
  tasks: TaskRow[];
  invoices: InvoiceRow[];
  communications: CommunicationRow[];
  approvals: ApprovalRow[];
  agentAudit: AgentRunRow[];
  notifications: NotificationRow[];
  creativeRuns: CreativeRunRow[];
  activity: ActivityRow[];
  deals: DealRow[];
  now: Date;
}

export interface CommandCenterData {
  asOf: string;
  attention: {
    items: AttentionItem[];
    total: number;
    critical: number;
    byKind: Record<string, number>;
  };
  vitals: {
    leads: { statuses: Record<string, number>; total: number; uncontacted: number };
    pipeline: { weighted: number; count: number; byStage: Record<string, number> };
    renewals: { overdue: number; in14: number; in30: number };
    finance: {
      open: number;
      openAmount: number;
      overdue: number;
      overdueAmount: number;
      paid30d: number;
      paid30dAmount: number;
    };
    operations: { dueToday: number; overdue: number; doneToday: number };
    ai: { runs24h: number; pendingApprovals: number; failures24h: number };
    comms: { thisMonth: number; inbound: number };
    risk: string[];
  };
  serviceBreakdown: Record<string, number>;
  recentActivity: ActivityRow[];
  jarvis: {
    status: "foundation";
    note: string;
    changed: string[];
    atRisk: string[];
    next: { title: string; actionLabel: string; actionKind: "tab" | "href"; actionTarget: string } | null;
    counts: { running: number; awaitingApproval: number; failures: number };
  };
}

const DAY_MS = 86400000;
const HOUR_MS = 3600000;
const SEV_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const STAGE_PROB: Record<string, number> = {
  lead: 0.2,
  qualified: 0.4,
  proposal: 0.6,
  negotiation: 0.8,
};
const INVOICE_DUE_DAYS = 14;
const INVOICE_OVERDUE_DAYS = 30;
const RENEWAL_ACTION_WINDOW = 14;

export function daysUntil(dateStr: string | null, now: Date): number | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((target - today) / DAY_MS);
}

function leadName(l: LeadRow): string {
  return (
    l.full_name ||
    [l.first_name, l.last_name].filter(Boolean).join(" ").trim() ||
    l.client_name ||
    l.email ||
    "Χωρίς όνομα"
  );
}

function hoursAgo(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (now.getTime() - t) / HOUR_MS;
}

function daysSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS);
}

function dateLabel(renewalDate: string): string {
  return renewalDate;
}

export function buildAttentionItems(input: CommandCenterInput): AttentionItem[] {
  const { leads, tasks, invoices, communications, approvals, notifications, creativeRuns, agentAudit, now } = input;
  const out: AttentionItem[] = [];

  const commByLead = new Set<string>();
  for (const c of communications) if (c.lead_id) commByLead.add(c.lead_id);

  // ── Renewals (source of truth: leads.renewal_date for customer leads) ────
  const renewals = leads.filter((l) => l.status === "customer" && l.renewal_date);
  const overdueRen = renewals
    .map((l) => ({ l, days: daysUntil(l.renewal_date!, now)! }))
    .filter((x) => x.days < 0)
    .sort((a, b) => a.days - b.days);

  for (const { l, days } of overdueRen) {
    out.push({
      id: `renewal-overdue-${l.id}`,
      kind: "renewal_overdue",
      severity: "critical",
      title: `Ανανέωση έληξε — ${leadName(l)}`,
      entity: leadName(l),
      entityId: l.id,
      reason: `Συμβόλαιο έληξε πριν ${-days} ημέρες · ${l.provider ?? l.service_category ?? ""}`.trim(),
      timestamp: `${l.renewal_date}T00:00:00Z`,
      owner: l.assigned_agent ?? "agapitos",
      actions: [{ label: "Open renewal", kind: "tab", target: "renewals" }],
    });
  }

  const dueRen = renewals
    .map((l) => ({ l, days: daysUntil(l.renewal_date!, now)! }))
    .filter((x) => x.days >= 0 && x.days <= RENEWAL_ACTION_WINDOW)
    .sort((a, b) => a.days - b.days)
    .slice(0, 8);

  for (const { l, days } of dueRen) {
    out.push({
      id: `renewal-due-${l.id}`,
      kind: "renewal_due",
      severity: "medium",
      title: `Ανανέωση σε ${days === 0 ? "σήμερα" : `${days} ημέρες`} — ${leadName(l)}`,
      entity: leadName(l),
      entityId: l.id,
      reason: `Συμβόλαιο λήγει στις ${dateLabel(l.renewal_date!)} · ${l.provider ?? l.service_category ?? ""}`.trim(),
      timestamp: `${l.renewal_date}T00:00:00Z`,
      owner: l.assigned_agent ?? "agapitos",
      actions: [{ label: "Open renewal", kind: "tab", target: "renewals" }],
    });
  }

  // ── Invoices (type invoice, sent/accepted, not paid) ─────────────────────
  const openInvoices = invoices.filter(
    (i) => i.type === "invoice" && (i.status === "sent" || i.status === "accepted") && i.created_at
  );
  for (const inv of openInvoices) {
    const age = daysSince(inv.created_at, now);
    if (age < INVOICE_DUE_DAYS) continue;
    const severity: Severity = age >= INVOICE_OVERDUE_DAYS ? "critical" : "high";
    const num = inv.invoice_number ?? "—";
    out.push({
      id: `invoice-${inv.id}`,
      kind: "invoice_overdue",
      severity,
      title: `Τιμολόγιο ${age} ημέρες ανοιχτό — ${num}`,
      entity: num,
      entityId: inv.id,
      reason: `Απεστάλη πριν ${age} ημέρες και δεν έχει εξοφληθεί`,
      timestamp: inv.created_at,
      owner: null,
      actions: [
        { label: "Chase", kind: "tab", target: "invoices" },
        { label: "Open invoice", kind: "tab", target: "invoices" },
      ],
    });
  }

  // ── Hot / uncontacted leads ──────────────────────────────────────────────
  const hot = leads
    .filter((l) => (l.status === "new_lead" || l.status === "contacted") && !commByLead.has(l.id) && l.created_at)
    .map((l) => ({ l, h: hoursAgo(l.created_at, now)! }))
    .filter((x) => x.h >= 12)
    .sort((a, b) => b.h - a.h)
    .slice(0, 6);

  for (const { l, h } of hot) {
    const severity: Severity = h >= 48 ? "critical" : h >= 24 ? "high" : "medium";
    const hh = Math.floor(h);
    out.push({
      id: `hot-lead-${l.id}`,
      kind: "hot_lead",
      severity,
      title: `Hot lead χωρίς επικοινωνία — ${leadName(l)}`,
      entity: leadName(l),
      entityId: l.id,
      reason: `${l.service_category ?? "—"} · ${l.source ?? "—"} · χωρίς κλήση ή email εδώ και ${hh} ώρες`,
      timestamp: l.created_at,
      owner: l.assigned_agent ?? null,
      actions: [
        { label: "Call", kind: "tab", target: "leads" },
        { label: "Open lead", kind: "tab", target: "leads" },
      ],
    });
  }

  // ── Overdue tasks/reminders (strictly before the start of today) ─────────
  const startOfTodayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const overdueTasks = tasks
    .filter((t) => !t.completed && t.start_time && new Date(t.start_time).getTime() < startOfTodayMs)
    .map((t) => ({ t, days: Math.floor((startOfTodayMs - new Date(t.start_time!).getTime()) / DAY_MS) }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 8);

  for (const { t, days } of overdueTasks) {
    const severity: Severity = days >= 3 ? "high" : "medium";
    out.push({
      id: `task-${t.id}`,
      kind: "overdue_task",
      severity,
      title: t.title || "Εκπρόθεσμη εργασία",
      entity: t.title || "task",
      entityId: t.id,
      reason: `Εκπρόθεσμη κατά ${days} ${days === 1 ? "ημέρα" : "ημέρες"}`,
      timestamp: t.start_time,
      owner: null,
      actions: [{ label: "Complete", kind: "tab", target: "calendar" }],
    });
  }

  // ── Pending approvals ────────────────────────────────────────────────────
  const pending = approvals
    .filter((a) => a.status === "pending" && (!a.expires_at || new Date(a.expires_at).getTime() > now.getTime()))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5);

  for (const ap of pending) {
    out.push({
      id: `approval-${ap.id}`,
      kind: "approval",
      severity: "medium",
      title: ap.summary || `${ap.agent_name ?? "JARVIS"}: ${ap.action_type ?? "action"}`,
      entity: ap.agent_name ?? "JARVIS",
      entityId: ap.id,
      reason: ap.expires_at
        ? `Εκκρεμής έγκριση · λήγει ${new Date(ap.expires_at).toLocaleString("el-GR")}`
        : "Εκκρεμής έγκριση",
      timestamp: ap.created_at,
      owner: null,
      actions: [{ label: "Review", kind: "tab", target: "ai" }],
    });
  }

  // ── Pending notifications ────────────────────────────────────────────────
  const pendingNotifs = notifications
    .filter((n) => n.status === "pending")
    .slice(0, 4);
  for (const n of pendingNotifs) {
    out.push({
      id: `notif-${n.id}`,
      kind: "notification",
      severity: "low",
      title: n.message || "Εκκρεμής ειδοποίηση",
      entity: n.type ?? "notification",
      entityId: n.id,
      reason: "Εκκρεμής ειδοποίηση για επεξεργασία",
      timestamp: n.created_at,
      owner: null,
      actions: [{ label: "Open", kind: "tab", target: "notifications" }],
    });
  }

  // ── Incidents (real failed automation/creative runs in last 24h) ────────
  const cut24 = new Date(now.getTime() - 24 * HOUR_MS).toISOString();
  const failedCreatives = creativeRuns.filter(
    (c) => (c.status === "failed" || c.status === "error") && c.created_at >= cut24
  );
  if (failedCreatives.length > 0) {
    out.push({
      id: "incident-creative",
      kind: "incident",
      severity: "high",
      title: "Creative Studio image generation failing",
      entity: "Creative Studio",
      entityId: null,
      reason: `${failedCreatives.length} αποτυχημένη${failedCreatives.length > 1 ? "ες" : ""} προσπάθεια${failedCreatives.length > 1 ? "ες" : ""} τις τελευταίες 24 ώρες`,
      timestamp: failedCreatives[0].created_at,
      owner: null,
      actions: [{ label: "Open incident", kind: "href", target: "/admin/creative" }],
    });
  }

  const agentFailures = agentAudit.filter(
    (r) => r.created_at >= cut24 && /(^|[^a-z])error|failed|failure/i.test(r.output_summary ?? "")
  );
  if (agentFailures.length > 0) {
    out.push({
      id: "agent-failures",
      kind: "agent_failure",
      severity: "medium",
      title: `JARVIS run failed — ${agentFailures[0].agent_name ?? agentFailures[0].output_summary?.slice(0, 40) ?? "agent"}`,
      entity: agentFailures[0].agent_name ?? "JARVIS",
      entityId: null,
      reason: `${agentFailures.length} αποτυχημένη${agentFailures.length > 1 ? "ες" : ""} εκτέλεση${agentFailures.length > 1 ? "ες" : ""} τις τελευταίες 24 ώρες`,
      timestamp: agentFailures[0].created_at,
      owner: null,
      actions: [{ label: "Investigate", kind: "tab", target: "ai" }],
    });
  }

  // Rank: severity first, then most recent first, then kind.
  return out.sort((a, b) => {
    const s = SEV_RANK[b.severity] - SEV_RANK[a.severity];
    if (s !== 0) return s;
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });
}

export function buildCommandCenter(input: CommandCenterInput): CommandCenterData {
  const { leads, tasks, invoices, communications, approvals, agentAudit, creativeRuns, activity, deals, now } = input;
  const items = buildAttentionItems(input);

  // ── Leads ────────────────────────────────────────────────────────────────
  const statuses: Record<string, number> = {};
  for (const l of leads) statuses[l.status ?? "unknown"] = (statuses[l.status ?? "unknown"] || 0) + 1;
  const totalLeads = leads.length;

  // ── Pipeline (weighted) ──────────────────────────────────────────────────
  let weighted = 0;
  let pipelineCount = 0;
  const byStage: Record<string, number> = {};
  for (const d of deals) {
    if (d.stage === "closed_won" || d.stage === "closed_lost") continue;
    pipelineCount++;
    byStage[d.stage ?? "lead"] = (byStage[d.stage ?? "lead"] || 0) + 1;
    weighted += (d.value ?? 0) * (STAGE_PROB[d.stage ?? ""] ?? 0.2);
  }

  // ── Renewals ─────────────────────────────────────────────────────────────
  const custRen = leads.filter((l) => l.status === "customer" && l.renewal_date);
  let renewOverdue = 0;
  let renewIn14 = 0;
  let renewIn30 = 0;
  for (const l of custRen) {
    const d = daysUntil(l.renewal_date!, now)!;
    if (d < 0) renewOverdue++;
    else if (d <= 14) renewIn14++;
    else if (d <= 30) renewIn30++;
  }

  // ── Finance ──────────────────────────────────────────────────────────────
  let openCount = 0;
  let openAmount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  for (const inv of invoices) {
    if (inv.type !== "invoice") continue;
    if (inv.status === "sent" || inv.status === "accepted") {
      openCount++;
      openAmount += inv.total ?? 0;
      if (daysSince(inv.created_at, now) >= INVOICE_OVERDUE_DAYS) {
        overdueCount++;
        overdueAmount += inv.total ?? 0;
      }
    }
  }
  let paid30d = 0;
  let paid30dAmount = 0;
  const cut30 = new Date(now.getTime() - 30 * DAY_MS).getTime();
  for (const inv of invoices) {
    if (inv.status === "paid" && inv.paid_at && new Date(inv.paid_at).getTime() >= cut30) {
      paid30d++;
      paid30dAmount += inv.total ?? 0;
    }
  }

  // ── Operations (tasks/reminders) ─────────────────────────────────────────
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const endOfToday = startOfToday + DAY_MS;
  let dueToday = 0;
  let taskOverdue = 0;
  let doneToday = 0;
  for (const t of tasks) {
    const st = t.start_time ? new Date(t.start_time).getTime() : null;
    if (!st) continue;
    if (t.completed) {
      if (st >= startOfToday && st < endOfToday) doneToday++;
      continue;
    }
    if (st < startOfToday) taskOverdue++;
    else if (st < endOfToday) dueToday++;
  }

  // ── AI activity ──────────────────────────────────────────────────────────
  const cut24 = new Date(now.getTime() - 24 * HOUR_MS).toISOString();
  const runs24h = agentAudit.filter((r) => r.created_at >= cut24).length;
  const pendingApprovals = approvals.filter((a) => a.status === "pending").length;
  const incFails = creativeRuns.filter((c) => (c.status === "failed" || c.status === "error") && c.created_at >= cut24).length;
  const auditFails = agentAudit.filter((r) => r.created_at >= cut24 && /(^|[^a-z])error|failed|failure/i.test(r.output_summary ?? "")).length;
  const failures24h = incFails + auditFails;

  // ── Communications ───────────────────────────────────────────────────────
  const monthStart = new Date(now);
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  let commsThisMonth = 0;
  let inbound = 0;
  for (const c of communications) {
    if (new Date(c.created_at).getTime() >= monthStart.getTime()) {
      commsThisMonth++;
      if (c.direction === "inbound") inbound++;
    }
  }

  // ── Service breakdown ────────────────────────────────────────────────────
  const serviceBreakdown: Record<string, number> = {};
  for (const l of leads) {
    const cat = l.service_category || "Άλλο";
    serviceBreakdown[cat] = (serviceBreakdown[cat] || 0) + 1;
  }

  const criticalHigh = items.filter((i) => i.severity === "critical" || i.severity === "high");

  const sortedActivity = [...activity].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const changed = sortedActivity.slice(0, 3).map((a) => {
    const t = new Date(a.created_at).toLocaleString("el-GR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
    return `${t} · ${a.action ?? ""} ${a.entity_type ?? ""}`.trim();
  });

  const atRisk = criticalHigh.slice(0, 3).map((i) => i.title);

  const nextItem = items[0] ?? null;
  const next = nextItem
    ? {
        title: nextItem.title,
        actionLabel: nextItem.actions[0]?.label ?? "Open",
        actionKind: (nextItem.actions[0]?.kind ?? "tab") as "tab" | "href",
        actionTarget: nextItem.actions[0]?.target ?? "dashboard",
      }
    : null;

  return {
    asOf: now.toISOString(),
    attention: {
      items,
      total: items.length,
      critical: items.filter((i) => i.severity === "critical").length,
      byKind: items.reduce<Record<string, number>>((acc, i) => {
        acc[i.kind] = (acc[i.kind] || 0) + 1;
        return acc;
      }, {}),
    },
    vitals: {
      leads: { statuses, total: totalLeads, uncontacted: statuses["new_lead"] || 0 },
      pipeline: { weighted: Math.round(weighted), count: pipelineCount, byStage },
      renewals: { overdue: renewOverdue, in14: renewIn14, in30: renewIn30 },
      finance: {
        open: openCount,
        openAmount: Math.round(openAmount),
        overdue: overdueCount,
        overdueAmount: Math.round(overdueAmount),
        paid30d,
        paid30dAmount: Math.round(paid30dAmount),
      },
      operations: { dueToday, overdue: taskOverdue, doneToday },
      ai: { runs24h, pendingApprovals, failures24h },
      comms: { thisMonth: commsThisMonth, inbound },
      risk: atRisk,
    },
    serviceBreakdown,
    recentActivity: sortedActivity.slice(0, 15),
    jarvis: {
      status: "foundation",
      note: "Rule-based suggestions from live CRM data. JARVIS orchestration is not enabled yet — tools, policies and approvals are the next layer. Nothing is sent or modified automatically.",
      changed,
      atRisk,
      next,
      counts: {
        running: 0,
        awaitingApproval: pendingApprovals,
        failures: failures24h,
      },
    },
  };
}