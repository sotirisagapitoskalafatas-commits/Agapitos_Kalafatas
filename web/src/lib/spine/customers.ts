// ─── Customer 360 (pure, testable) ───────────────────────────────────────────
//
// A "customer record" is DERIVED from existing live rows — there is no customers
// table yet. The derivation rule (kept explicit so a future masters table can
// replace it without touching the UI):
//     a lead is a customer when  status === "customer"
//     OR it has any deal / invoice / communication linked to it.
//
// The customer index lists those records. The Customer 360 profile is a single
// human/company record that groups REAL rows from leads, deals, invoices,
// communications, calendar events, renewal reminders and consent/activity log.
// Domains with no backend today (insurance, web projects, contracts) are
// returned as honest "planned" placeholders — nothing is fabricated.
//
// Maturity dots used by the UI:
//     live    – backed by a real table today
//     derived – real rows reinterpreted (e.g. quotes = invoices of type quote)
//     planned – no backend exists yet; the UI shows an honest empty state

export type CustomerSectionMode = "live" | "derived" | "planned";

export type CustomerSectionKey =
  | "profile"
  | "leads"
  | "opportunities"
  | "services"
  | "energy"
  | "insurance"
  | "web"
  | "documents"
  | "quotes"
  | "contracts"
  | "renewals"
  | "tasks"
  | "communications"
  | "invoices"
  | "payments"
  | "activity";

export interface CustomerSectionMeta {
  key: CustomerSectionKey;
  label: string;
  mode: CustomerSectionMode;
  note?: string;
}

// The 16-section rail in the order the owner specified.
export const CUSTOMER_SECTIONS: CustomerSectionMeta[] = [
  { key: "profile", label: "Profile", mode: "live" },
  { key: "leads", label: "Leads", mode: "live", note: "Ως εγγραφές leads (ίδιο email/τηλ.)" },
  { key: "opportunities", label: "Opportunities", mode: "live", note: "Deals που συνδέονται με το lead" },
  { key: "services", label: "Services", mode: "live", note: "Κατηγορία υπηρεσίας, tags, παροχές" },
  { key: "energy", label: "Energy", mode: "live", note: "Πάροχος, πρόγραμμα, παροχές (supplies)" },
  { key: "insurance", label: "Insurance", mode: "planned" },
  { key: "web", label: "Web Projects", mode: "planned" },
  { key: "documents", label: "Documents", mode: "live", note: "Αρχεία attached_files του lead" },
  { key: "quotes", label: "Quotes", mode: "derived", note: "Από τιμολόγια τύπου quote" },
  { key: "contracts", label: "Contracts", mode: "planned" },
  { key: "renewals", label: "Renewals", mode: "live", note: "renewal_date + renewal_reminders" },
  { key: "tasks", label: "Tasks", mode: "live", note: "Από calendar_events του lead" },
  { key: "communications", label: "Communications", mode: "live" },
  { key: "invoices", label: "Invoices", mode: "live", note: "Τιμολόγια τύπου invoice" },
  { key: "payments", label: "Payments", mode: "derived", note: "Από εξοφλημένα τιμολόγια" },
  { key: "activity", label: "Activity", mode: "live", note: "activity_log + χρόνοι δημιουργίας" },
];

// ── Input rows (the shape the route fetches) ────────────────────────────────
export interface CustomerLeadRow {
  id: string;
  client_name: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  region: string | null;
  status: string | null;
  service_category: string | null;
  provider: string | null;
  program: string | null;
  source: string | null;
  lead_type: string | null;
  partner: string | null;
  assigned_agent: string | null;
  renewal_date: string | null;
  gdpr_consent: boolean | null;
  consent_granted_at: string | null;
  consent_source: string | null;
  consent_version: string | null;
  ack_sent_at: string | null;
  supplies?: unknown[] | null;
  attached_files?: unknown[] | null;
  tags?: string[] | null;
  notes: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CustomerDealRow {
  id: string;
  lead_id: string | null;
  title: string | null;
  value: number | null;
  currency: string | null;
  stage: string | null;
  expected_close_date: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface CustomerInvoiceRow {
  id: string;
  lead_id: string | null;
  deal_id: string | null;
  invoice_number: string | null;
  type: string | null;
  status: string | null;
  total: number | null;
  currency: string | null;
  valid_until: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface CustomerCommRow {
  id: string;
  lead_id: string | null;
  deal_id: string | null;
  comm_type: string | null;
  direction: string | null;
  subject: string | null;
  body: string | null;
  created_at: string;
}

export interface CustomerEventRow {
  id: string;
  lead_id: string | null;
  deal_id: string | null;
  title: string | null;
  description: string | null;
  event_type: string | null;
  start_time: string | null;
  end_time: string | null;
  completed: boolean | null;
  created_at: string;
}

export interface CustomerReminderRow {
  id: string;
  lead_id: string | null;
  renewal_date: string | null;
  window_days: number | null;
  status: string | null;
  due_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface CustomerActivityRow {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  action: string | null;
  details: unknown;
  created_at: string;
}

// ── Service requests (2026-09-08 migration) ──────────────────────────────────
// One person/lead can have many requests. The request lifecycle is INDEPENDENT
// of the parent lead lifecycle: a lead may be "customer" while a request is
// still "new", or "changed_mind" later. Request history lives in activity_log
// (entity_type="service_request") — nothing is deleted on close/reopen.

export const SERVICE_KINDS = ["energy", "insurance", "web"] as const;
export type ServiceKind = (typeof SERVICE_KINDS)[number];

export const SERVICE_KIND_LABELS: Record<ServiceKind, string> = {
  energy: "Energy",
  insurance: "Insurance",
  web: "Web / Software",
};

export const REQUEST_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "changed_mind",
  "not_interested",
  "nurture",
  "cancelled",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

/** Statuses that represent an open/live request. Others are historical/closed. */
export const ACTIVE_REQUEST_STATUSES: ReadonlySet<RequestStatus> = new Set<RequestStatus>([
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "nurture",
]);

export function isActiveRequestStatus(s: RequestStatus): boolean {
  return ACTIVE_REQUEST_STATUSES.has(s);
}

export interface ServiceRequestRow {
  id: string;
  lead_id: string;
  service: ServiceKind;
  service_type: string | null;
  reason: string | null;
  description: string | null;
  status: RequestStatus;
  priority: RequestPriority;
  owner: string | null;
  source: string | null;
  campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  next_action: string | null;
  lost_reason: string | null;
  closed_reason: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ServiceRequestView {
  id: string;
  service: ServiceKind;
  serviceType: string | null;
  reason: string | null;
  description: string | null;
  status: RequestStatus;
  priority: RequestPriority;
  owner: string | null;
  source: string | null;
  campaign: string | null;
  nextAction: string | null;
  lostReason: string | null;
  closedReason: string | null;
  createdAt: string;
  updatedAt: string | null;
  /** Reconstructed from activity_log — the status to restore when reopening. */
  reopenStatus?: RequestStatus;
}

export type ServiceRequestEventLine = ActivityLine;

export type RequestChangeAction =
  | "created"
  | "updated"
  | "status_changed"
  | "service_changed"
  | "owner_changed"
  | "closed"
  | "reopened";

export interface RequestChangeEvent {
  action: RequestChangeAction;
  field?: string;
  fromValue?: unknown;
  toValue?: unknown;
}

export interface RequestPatch {
  service?: ServiceKind | null;
  service_type?: string | null;
  reason?: string | null;
  description?: string | null;
  status?: RequestStatus | null;
  priority?: RequestPriority | null;
  owner?: string | null;
  source?: string | null;
  campaign?: string | null;
  next_action?: string | null;
  closed_reason?: string | null;
  lost_reason?: string | null;
}

const REQUEST_TEXT_FIELDS: (keyof RequestPatch)[] = [
  "service_type",
  "reason",
  "description",
  "owner",
  "source",
  "campaign",
  "next_action",
  "closed_reason",
  "lost_reason",
];

/** Pure patch application — returns the new row plus the change events the
 *  caller should persist to activity_log. "" is normalized to null. */
export function applyRequestPatch(
  row: ServiceRequestRow,
  patch: RequestPatch
): { row: ServiceRequestRow; events: RequestChangeEvent[] } {
  const next: ServiceRequestRow = { ...row };
  const events: RequestChangeEvent[] = [];
  const wasActive = isActiveRequestStatus(row.status);
  const willActive = patch.status ? isActiveRequestStatus(patch.status) : wasActive;

  for (const key of Object.keys(patch) as (keyof RequestPatch)[]) {
    if (key === "status") continue;
    let value = patch[key];
    if (value === undefined) continue;
    if (typeof value === "string" && REQUEST_TEXT_FIELDS.includes(key)) {
      value = value.trim() === "" ? null : value.trim();
    }
    const cur = next[key];
    if (value === cur) continue;
    (next as unknown as Record<string, unknown>)[key] = value;
    const action: RequestChangeEvent["action"] =
      key === "service" ? "service_changed" : key === "owner" ? "owner_changed" : "updated";
    events.push({ action, field: key, fromValue: cur as unknown, toValue: value as unknown });
  }

  if (patch.status && patch.status !== row.status) {
    events.push({
      action: "status_changed",
      field: "status",
      fromValue: row.status,
      toValue: patch.status,
    });
    next.status = patch.status;
    if (!wasActive && willActive) events.push({ action: "reopened", field: "status", fromValue: row.status, toValue: patch.status });
    else if (wasActive && !willActive) events.push({ action: "closed", field: "status", fromValue: row.status, toValue: patch.status });
  }

  return { row: next, events };
}

export function requestView(r: ServiceRequestRow): ServiceRequestView {
  return {
    id: r.id,
    service: r.service,
    serviceType: r.service_type,
    reason: r.reason,
    description: r.description,
    status: r.status,
    priority: r.priority,
    owner: r.owner,
    source: r.source,
    campaign: r.campaign,
    nextAction: r.next_action,
    lostReason: r.lost_reason,
    closedReason: r.closed_reason,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function activeRequests(rows: ServiceRequestRow[]): ServiceRequestView[] {
  return rows.filter((r) => isActiveRequestStatus(r.status)).map(requestView);
}

export function closedRequests(rows: ServiceRequestRow[]): ServiceRequestView[] {
  return rows.filter((r) => !isActiveRequestStatus(r.status)).map(requestView);
}

const REQUEST_EVENT_META: Record<RequestChangeAction, { title: string }> = {
  created: { title: "Αίτηση υπηρεσίας δημιουργήθηκε" },
  updated: { title: "Αίτηση ενημερώθηκε" },
  status_changed: { title: "Κατάσταση άλλαξε" },
  service_changed: { title: "Υπηρεσία άλλαξε" },
  owner_changed: { title: "Ανάθεση άλλαξε" },
  closed: { title: "Αίτηση έκλεισε" },
  reopened: { title: "Αίτηση άνοιξε ξανά" },
};

function requestEventDetail(a: CustomerActivityRow): string | null {
  const d = (typeof a.details === "object" && a.details !== null ? a.details : {}) as Record<string, unknown>;
  const from = d.fromValue ?? d.from;
  const to = d.toValue ?? d.to;
  if (a.action === "status_changed" && (from !== undefined || to !== undefined)) {
    return [from, to].filter((v) => v !== undefined && v !== null).map(String).join(" → ");
  }
  if ((a.action === "service_changed" || a.action === "owner_changed") && (from !== undefined || to !== undefined)) {
    return [from, to].filter((v) => v !== undefined && v !== null).map(String).join(" → ");
  }
  if (typeof d.field === "string" && to !== undefined) return `${d.field}: ${String(to)}`;
  if (typeof d.note === "string") return d.note;
  return a.action ?? null;
}

/** Request history timeline (created + activity_log events), most recent first. */
export function requestTimeline(r: ServiceRequestRow, activity: CustomerActivityRow[]): ActivityLine[] {
  const lines: ActivityLine[] = [
    {
      id: `request-created-${r.id}`,
      at: r.created_at,
      title: REQUEST_EVENT_META.created.title,
      detail: `${SERVICE_KIND_LABELS[r.service]}${r.service_type ? ` · ${r.service_type}` : ""}`,
    },
  ];
  for (const a of activity) {
    if (a.entity_id !== r.id) continue;
    lines.push({
      id: `request-event-${a.id}`,
      at: a.created_at,
      title: REQUEST_EVENT_META[a.action as RequestChangeAction]?.title ?? a.action ?? "Καταγραφή",
      detail: requestEventDetail(a) ?? null,
    });
  }
  lines.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
  return lines;
}

/** The last active status of a closed request, reconstructed from its
 *  activity_log events — used as the natural target when reopening. */
export function lastActiveRequestStatus(
  requestId: string,
  activity: CustomerActivityRow[],
  requests: ServiceRequestRow[]
): RequestStatus {
  const req = requests.find((r) => r.id === requestId);
  if (req && isActiveRequestStatus(req.status)) return req.status;
  const events = activity
    .filter((a) => a.entity_id === requestId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  for (const a of events) {
    const d = (typeof a.details === "object" && a.details !== null ? a.details : {}) as Record<string, unknown>;
    const from = d.fromValue ?? d.from;
    const to = d.toValue ?? d.to;
    if (typeof to === "string" && isActiveRequestStatus(to as RequestStatus)) return to as RequestStatus;
    if (typeof from === "string" && isActiveRequestStatus(from as RequestStatus)) return from as RequestStatus;
  }
  return "new";
}

export interface Customer360Input {
  leads: CustomerLeadRow[];
  requests: ServiceRequestRow[];
  deals: CustomerDealRow[];
  invoices: CustomerInvoiceRow[];
  communications: CustomerCommRow[];
  events: CustomerEventRow[];
  reminders: CustomerReminderRow[];
  activity: CustomerActivityRow[];
  now: Date;
}

// ── Derived output shapes ────────────────────────────────────────────────────
export type RenewalState = "overdue" | "due" | "upcoming" | null;

export interface CustomerRecord {
  key: string; // source lead id (stable until a customers table exists)
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  isCustomer: boolean;
  services: string[];
  renewalDate: string | null;
  renewalState: RenewalState;
  counts: {
    deals: number;
    invoices: number;
    communications: number;
    tasks: number;
    documents: number;
    payments: number;
    requests: number;
  };
  lastContactAt: string | null;
  createdAt: string;
}

export interface CustomerIndexData {
  asOf: string;
  totalLeads: number;
  activeLeadCount: number;
  rule: string;
  records: CustomerRecord[];
}

export interface DealView {
  id: string;
  title: string | null;
  stage: string | null;
  value: number | null;
  currency: string | null;
  expectedCloseDate: string | null;
  closedAt: string | null;
  createdAt: string;
}

export interface InvoiceView {
  id: string;
  invoiceNumber: string | null;
  type: string | null;
  status: string | null;
  total: number | null;
  currency: string | null;
  validUntil: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CommView {
  id: string;
  commType: string | null;
  direction: string | null;
  subject: string | null;
  body: string | null;
  createdAt: string;
}

export interface TaskView {
  id: string;
  title: string | null;
  eventType: string | null;
  completed: boolean | null;
  startTime: string | null;
}

export interface PaymentView {
  id: string;
  invoiceNumber: string | null;
  total: number | null;
  currency: string | null;
  paidAt: string;
}

export interface ActivityLine {
  id: string;
  at: string;
  title: string;
  detail: string | null;
}

export interface Customer360Data {
  key: string;
  isCustomer: boolean;
  asOf: string;
  profile: {
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    address: string | null;
    region: string | null;
    status: string | null;
    serviceCategory: string | null;
    provider: string | null;
    program: string | null;
    source: string | null;
    leadType: string | null;
    partner: string | null;
    assignedAgent: string | null;
    renewalDate: string | null;
    renewalState: RenewalState;
    gdprConsent: boolean | null;
    consentSource: string | null;
    consentVersion: string | null;
    consentGrantedAt: string | null;
    notes: string | null;
    comments: string | null;
    createdAt: string;
    updatedAt: string | null;
  };
  relatedLeads: Array<{ key: string; name: string; email: string | null; phone: string | null; status: string | null; matchedBy: "email" | "phone" }>;
  services: string[];
  requests: ServiceRequestView[];
  requestHistory: Record<string, ActivityLine[]>;
  energy: {
    provider: string | null;
    program: string | null;
    supplies: Array<{ supply_number: string | null; type: string | null; address: string | null; provider: string | null; notes: string | null }>;
  };
  documents: Array<{ name: string | null; url: string | null; path: string | null; type: string | null }>;
  opportunities: { deals: DealView[] };
  quotes: { invoices: InvoiceView[] };
  renewals: {
    renewalDate: string | null;
    renewalState: RenewalState;
    reminders: Array<{ id: string; renewalDate: string | null; windowDays: number | null; status: string | null; dueAt: string | null; sentAt: string | null; createdAt: string }>;
  };
  tasks: { items: TaskView[] };
  communications: { items: CommView[] };
  invoices: { invoices: InvoiceView[] };
  payments: { payments: PaymentView[] };
  activity: { items: ActivityLine[] };
}

export function customerName(l: CustomerLeadRow): string {
  return (
    l.full_name ||
    [l.first_name, l.last_name].filter(Boolean).join(" ").trim() ||
    l.client_name ||
    l.email ||
    "Χωρίς όνομα"
  );
}

function asRecords<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function leadServices(l: CustomerLeadRow): string[] {
  const out = new Set<string>();
  if (l.service_category) out.add(l.service_category);
  for (const t of l.tags ?? []) if (t) out.add(t);
  for (const s of asRecords<{ type?: string }>(l.supplies)) if (s.type) out.add(s.type);
  return Array.from(out);
}

const DAY_MS = 86400000;

function daysUntilUTC(dateStr: string | null, now: Date): number | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((target - today) / DAY_MS);
}

export function renewalStateOf(dateStr: string | null, now: Date): RenewalState {
  const d = daysUntilUTC(dateStr, now);
  if (d === null) return null;
  if (d < 0) return "overdue";
  if (d <= 14) return "due";
  return "upcoming";
}

function relatedLeads(l: CustomerLeadRow, all: CustomerLeadRow[]) {
  const byEmail = new Map<string, CustomerLeadRow>();
  const byPhone = new Map<string, CustomerLeadRow>();
  for (const other of all) {
    if (other.id === l.id) continue;
    const email = (other.email ?? "").trim().toLowerCase();
    if (email) byEmail.set(email, other);
    const phone = (other.phone ?? "").trim();
    if (phone) byPhone.set(phone, other);
  }
  const myEmail = (l.email ?? "").trim().toLowerCase();
  const myPhone = (l.phone ?? "").trim();
  const out: { key: string; name: string; email: string | null; phone: string | null; status: string | null; matchedBy: "email" | "phone" }[] = [];
  const seen = new Set<string>();
  if (myEmail && byEmail.has(myEmail)) {
    const o = byEmail.get(myEmail)!;
    if (!seen.has(o.id)) {
      seen.add(o.id);
      out.push({ key: o.id, name: customerName(o), email: o.email, phone: o.phone, status: o.status, matchedBy: "email" });
    }
  }
  if (myPhone && byPhone.has(myPhone)) {
    const o = byPhone.get(myPhone)!;
    if (!seen.has(o.id)) {
      seen.add(o.id);
      out.push({ key: o.id, name: customerName(o), email: o.email, phone: o.phone, status: o.status, matchedBy: "phone" });
    }
  }
  return out;
}

function isCustomerLead(l: CustomerLeadRow, input: Customer360Input): boolean {
  if (l.status === "customer") return true;
  const anyOf = (rows: { lead_id: string | null }[]) => rows.some((r) => r.lead_id === l.id);
  return anyOf(input.deals) || anyOf(input.invoices) || anyOf(input.communications);
}

export function buildCustomerIndex(input: Customer360Input): CustomerIndexData {
  const records: CustomerRecord[] = [];
  for (const l of input.leads) {
    if (!isCustomerLead(l, input)) continue;
    const deals = input.deals.filter((d) => d.lead_id === l.id);
    const invoices = input.invoices.filter((i) => i.lead_id === l.id);
    const comms = input.communications.filter((c) => c.lead_id === l.id);
    const events = input.events.filter((e) => e.lead_id === l.id);
    const reqs = input.requests.filter((r) => r.lead_id === l.id);
    const payments = invoices.filter((i) => i.status === "paid" && i.paid_at);
    const lastContacts = [...comms.map((c) => c.created_at), ...events.map((e) => e.created_at)].filter(Boolean);
    records.push({
      key: l.id,
      name: customerName(l),
      email: l.email,
      phone: l.phone,
      status: l.status,
      isCustomer: true,
      services: leadServices(l),
      renewalDate: l.renewal_date,
      renewalState: renewalStateOf(l.renewal_date, input.now),
      counts: {
        deals: deals.length,
        invoices: invoices.filter((i) => i.type === "invoice").length,
        communications: comms.length,
        tasks: events.filter((e) => (e.event_type ?? "meeting") !== "meeting" || e.completed !== null).length,
        documents: asRecords<unknown>(l.attached_files).length,
        payments: payments.length,
        requests: reqs.length,
      },
      lastContactAt: lastContacts.sort().at(-1) ?? null,
      createdAt: l.created_at,
    });
  }
  records.sort((a, b) => {
    if (a.renewalState === "overdue" && b.renewalState !== "overdue") return -1;
    if (b.renewalState === "overdue" && a.renewalState !== "overdue") return 1;
    return a.name.localeCompare(b.name, "el");
  });

  return {
    asOf: input.now.toISOString(),
    totalLeads: input.leads.length,
    activeLeadCount: input.leads.length - records.length,
    rule: "Ένα lead γίνεται πελάτης όταν αποκτά κατάσταση customer ή όταν έχει deal, τιμολόγιο ή επικοινωνία.",
    records,
  };
}

// Builds a flat, real activity timeline for one lead from all its rows.
export function activityForLead(l: CustomerLeadRow, input: Customer360Input): ActivityLine[] {
  const idByLead = <T extends { lead_id: string | null }>(rels: T[]) => rels.filter((r) => r.lead_id === l.id);
  const deals = idByLead(input.deals);
  const invoices = idByLead(input.invoices);
  const comms = idByLead(input.communications);
  const events = idByLead(input.events);
  const reminders = input.reminders.filter((r) => r.lead_id === l.id);
  const requests = idByLead(input.requests);
  const relatedIds = new Set<string>([l.id, ...deals.map((d) => d.id), ...invoices.map((i) => i.id), ...comms.map((c) => c.id), ...events.map((e) => e.id), ...requests.map((r) => r.id)]);
  const lines: ActivityLine[] = [
    { id: "lead-created", at: l.created_at, title: "Lead δημιουργήθηκε", detail: l.service_category ?? null },
  ];
  if (l.consent_granted_at) lines.push({ id: "consent", at: l.consent_granted_at, title: "Συναίνεση GDPR", detail: `${l.consent_source ?? ""} · v${l.consent_version ?? ""}`.trim() || null });
  if (l.ack_sent_at) lines.push({ id: "ack", at: l.ack_sent_at, title: "Email επιβεβαίωσης στάλθηκε", detail: null });
  for (const d of deals) {
    lines.push({ id: `deal-${d.id}`, at: d.created_at, title: `Deal: ${d.title ?? "—"}`, detail: d.stage ?? null });
    if (d.closed_at) lines.push({ id: `deal-closed-${d.id}`, at: d.closed_at, title: `Deal έκλεισε: ${d.title ?? "—"}`, detail: d.stage ?? null });
  }
  for (const i of invoices) {
    lines.push({ id: `invoice-${i.id}`, at: i.created_at, title: `Τιμολόγιο ${i.invoice_number ?? "—"}`, detail: `${i.status ?? ""} · ${i.type ?? ""}` });
    if (i.paid_at) lines.push({ id: `paid-${i.id}`, at: i.paid_at, title: `Εξοφλήθηκε ${i.invoice_number ?? "—"}`, detail: null });
  }
  for (const c of comms) {
    lines.push({ id: `comm-${c.id}`, at: c.created_at, title: `${c.direction === "inbound" ? "Εισερχόμενη" : "Εξερχόμενη"} επικοινωνία · ${c.comm_type ?? ""}`, detail: c.subject ?? null });
  }
  for (const e of events) {
    lines.push({ id: `event-${e.id}`, at: e.created_at, title: `Εργασία: ${e.title ?? "—"}`, detail: `${e.event_type ?? ""}${e.completed ? " · ολοκληρώθηκε" : ""}` });
  }
  for (const r of reminders) {
    lines.push({ id: `reminder-${r.id}`, at: r.created_at, title: "Υπενθύμιση ανανέωσης", detail: r.status ?? null });
    if (r.sent_at) lines.push({ id: `reminder-sent-${r.id}`, at: r.sent_at, title: "Υπενθύμιση ανανέωσης στάλθηκε", detail: null });
  }
  for (const r of requests) {
    lines.push(...requestTimeline(r, input.activity));
  }
  for (const a of input.activity) {
    if (a.entity_type === "service_request") continue; // rendered per request above
    if (a.entity_id && relatedIds.has(a.entity_id)) {
      lines.push({ id: `activity-${a.id}`, at: a.created_at, title: a.action ?? "Καταγραφή", detail: a.entity_type ?? null });
    }
  }
  lines.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return lines;
}

export function buildCustomer360(input: Customer360Input, leadId: string): Customer360Data | null {
  const l = input.leads.find((x) => x.id === leadId);
  if (!l) return null;

  const deals = input.deals.filter((d) => d.lead_id === leadId);
  const invoices = input.invoices.filter((i) => i.lead_id === leadId);
  const comms = input.communications.filter((c) => c.lead_id === leadId);
  const events = input.events.filter((e) => e.lead_id === leadId);
  const reminders = input.reminders.filter((r) => r.lead_id === leadId);
  const requests = input.requests.filter((r) => r.lead_id === leadId);

  const dealView = (d: CustomerDealRow): DealView => ({
    id: d.id,
    title: d.title,
    stage: d.stage,
    value: d.value,
    currency: d.currency,
    expectedCloseDate: d.expected_close_date,
    closedAt: d.closed_at,
    createdAt: d.created_at,
  });
  const invoiceView = (i: CustomerInvoiceRow): InvoiceView => ({
    id: i.id,
    invoiceNumber: i.invoice_number,
    type: i.type,
    status: i.status,
    total: i.total,
    currency: i.currency,
    validUntil: i.valid_until,
    paidAt: i.paid_at,
    createdAt: i.created_at,
  });

  return {
    key: l.id,
    isCustomer: isCustomerLead(l, input),
    asOf: input.now.toISOString(),
    profile: {
      name: customerName(l),
      email: l.email,
      phone: l.phone,
      company: l.company,
      address: l.address,
      region: l.region,
      status: l.status,
      serviceCategory: l.service_category,
      provider: l.provider,
      program: l.program,
      source: l.source,
      leadType: l.lead_type,
      partner: l.partner,
      assignedAgent: l.assigned_agent,
      renewalDate: l.renewal_date,
      renewalState: renewalStateOf(l.renewal_date, input.now),
      gdprConsent: l.gdpr_consent,
      consentSource: l.consent_source,
      consentVersion: l.consent_version,
      consentGrantedAt: l.consent_granted_at,
      notes: l.notes,
      comments: l.comments,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    },
    relatedLeads: relatedLeads(l, input.leads),
    services: leadServices(l),
    requests: requests.map((r) => ({
      ...requestView(r),
      reopenStatus: lastActiveRequestStatus(r.id, input.activity, input.requests),
    })),
    requestHistory: Object.fromEntries(requests.map((r) => [r.id, requestTimeline(r, input.activity)])),
    energy: {
      provider: l.provider,
      program: l.program,
      supplies: asRecords<{ supply_number?: string | null; type?: string | null; address?: string | null; provider?: string | null; notes?: string | null }>(l.supplies).map((s) => ({
        supply_number: s.supply_number ?? null,
        type: s.type ?? null,
        address: s.address ?? null,
        provider: s.provider ?? null,
        notes: s.notes ?? null,
      })),
    },
    documents: asRecords<{ name?: string | null; url?: string | null; path?: string | null; type?: string | null }>(l.attached_files).map((d) => ({
      name: d.name ?? null,
      url: d.url ?? null,
      path: d.path ?? null,
      type: d.type ?? null,
    })),
    opportunities: { deals: deals.map(dealView) },
    quotes: { invoices: invoices.filter((i) => i.type === "quote").map(invoiceView) },
    renewals: {
      renewalDate: l.renewal_date,
      renewalState: renewalStateOf(l.renewal_date, input.now),
      reminders: reminders.map((r) => ({
        id: r.id,
        renewalDate: r.renewal_date,
        windowDays: r.window_days,
        status: r.status,
        dueAt: r.due_at,
        sentAt: r.sent_at,
        createdAt: r.created_at,
      })),
    },
    tasks: {
      items: events.map((e) => ({
        id: e.id,
        title: e.title,
        eventType: e.event_type,
        completed: e.completed,
        startTime: e.start_time,
      })),
    },
    communications: {
      items: comms.map((c) => ({
        id: c.id,
        commType: c.comm_type,
        direction: c.direction,
        subject: c.subject,
        body: c.body,
        createdAt: c.created_at,
      })),
    },
    invoices: { invoices: invoices.filter((i) => i.type === "invoice").map(invoiceView) },
    payments: {
      payments: invoices
        .filter((i) => i.status === "paid" && i.paid_at)
        .map((i) => ({
          id: i.id,
          invoiceNumber: i.invoice_number,
          total: i.total,
          currency: i.currency,
          paidAt: i.paid_at!,
        })),
    },
    activity: { items: activityForLead(l, input) },
  };
}

export function sectionMode(key: CustomerSectionKey): CustomerSectionMode {
  return CUSTOMER_SECTIONS.find((s) => s.key === key)?.mode ?? "planned";
}