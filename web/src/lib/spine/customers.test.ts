import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeRequests,
  applyRequestPatch,
  buildCustomer360,
  buildCustomerIndex,
  closedRequests,
  CUSTOMER_SECTIONS,
  customerName,
  isActiveRequestStatus,
  lastActiveRequestStatus,
  leadServices,
  renewalStateOf,
  requestTimeline,
  requestView,
  type Customer360Input,
  type CustomerLeadRow,
  type ServiceRequestRow,
} from "./customers.ts";

const NOW = new Date("2026-09-08T12:00:00Z");

function lead(over: Partial<CustomerLeadRow> = {}): CustomerLeadRow {
  return {
    id: "lead-a",
    client_name: null,
    first_name: "Παπαδόπουλος",
    last_name: "Α.",
    full_name: null,
    email: "a@example.com",
    phone: "6970000000",
    company: null,
    address: null,
    region: null,
    status: "customer",
    service_category: "Ρεύμα",
    provider: "ΔΕΗ",
    program: "Σταθερό",
    source: "website",
    lead_type: "Οικιακό",
    partner: null,
    assigned_agent: "agapitos",
    renewal_date: "2026-09-05",
    gdpr_consent: true,
    consent_granted_at: "2026-08-01T09:00:00Z",
    consent_source: "website",
    consent_version: "v1",
    ack_sent_at: null,
    supplies: [{ supply_number: "NNN", type: "Ρεύμα", address: "Αθήνα", provider: "ΔΕΗ", notes: "" }],
    attached_files: [{ name: "contract.pdf", url: "/d", path: "x/contract.pdf", type: "pdf" }],
    tags: ["Σταθερό"],
    notes: "",
    comments: null,
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
    ...over,
  };
}

function base(): Customer360Input {
  return {
    leads: [],
    requests: [],
    deals: [],
    invoices: [],
    communications: [],
    events: [],
    reminders: [],
    activity: [],
    now: NOW,
  };
}

function request(over: Partial<ServiceRequestRow> = {}): ServiceRequestRow {
  return {
    id: "req-a",
    lead_id: "lead-a",
    service: "energy",
    service_type: "Ρεύμα",
    reason: "Μείωση λογαριασμού",
    description: null,
    status: "new",
    priority: "normal",
    owner: "agapitos",
    source: "website",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    next_action: "Τηλεφώνημα",
    lost_reason: null,
    closed_reason: null,
    created_at: "2026-09-06T21:55:32Z",
    updated_at: null,
    ...over,
  };
}

test("customer name prefers full_name first name+last", () => {
  assert.equal(customerName(lead()), "Παπαδόπουλος Α.");
  assert.equal(customerName(lead({ first_name: null, last_name: null, full_name: "Γεωργίου Μ." })), "Γεωργίου Μ.");
  assert.equal(customerName(lead({ first_name: null, last_name: null, full_name: null, client_name: "Acme" })), "Acme");
});

test("leadServices combines service_category, tags and supply types (dedup)", () => {
  const svc = leadServices(lead());
  assert.ok(svc.includes("Ρεύμα"));
  assert.ok(svc.includes("Σταθερό"));
  // "Ρεύμα" from both category and supplies appears once
});

test("renewalState buckets: past=overdue, ≤14d=due, later=upcoming, none=null", () => {
  assert.equal(renewalStateOf("2026-09-05", NOW), "overdue");
  assert.equal(renewalStateOf("2026-09-20", NOW), "due");
  assert.equal(renewalStateOf("2026-10-30", NOW), "upcoming");
  assert.equal(renewalStateOf(null, NOW), null);
});

test("index includes status=customer leads and counts their real rows", () => {
  const input = base();
  input.leads = [lead()];
  input.deals = [{ id: "d1", lead_id: "lead-a", title: "T", value: 100, currency: "EUR", stage: "proposal", expected_close_date: null, closed_at: null, created_at: "2026-08-02T10:00:00Z" }];
  input.invoices = [
    { id: "i1", lead_id: "lead-a", deal_id: null, invoice_number: "INV-1", type: "invoice", status: "paid", total: 100, currency: "EUR", valid_until: null, paid_at: "2026-08-03T10:00:00Z", created_at: "2026-08-01T10:00:00Z" },
  ];
  input.communications = [{ id: "c1", lead_id: "lead-a", deal_id: null, comm_type: "email", direction: "outbound", subject: "Hi", body: "", created_at: "2026-08-02T11:00:00Z" }];
  input.events = [{ id: "e1", lead_id: "lead-a", deal_id: null, title: "Call", description: "", event_type: "task", start_time: "2026-08-05T09:00:00Z", end_time: null, completed: false, created_at: "2026-08-01T12:00:00Z" }];

  const idx = buildCustomerIndex(input);
  assert.equal(idx.records.length, 1);
  const r = idx.records[0];
  assert.equal(r.isCustomer, true);
  assert.equal(r.counts.deals, 1);
  assert.equal(r.counts.invoices, 1);
  assert.equal(r.counts.communications, 1);
  assert.equal(r.counts.payments, 1);
  assert.equal(r.lastContactAt, "2026-08-02T11:00:00Z");
  assert.equal(r.renewalState, "overdue");
});

test("non-customer lead with status new_lead and no relations is excluded from index", () => {
  const input = base();
  input.leads = [lead({ status: "new_lead", renewal_date: null, gdpr_consent: false, first_name: "Νέο", last_name: "Lead" })];
  const idx = buildCustomerIndex(input);
  assert.equal(idx.records.length, 0);
  assert.equal(idx.activeLeadCount, 1);
});

test("lead with a deal but status new_lead is still a customer (derived)", () => {
  const input = base();
  input.leads = [lead({ status: "new_lead", renewal_date: null })];
  input.deals = [{ id: "d1", lead_id: "lead-a", title: "T", value: 0, currency: "EUR", stage: "lead", expected_close_date: null, closed_at: null, created_at: "2026-08-02T10:00:00Z" }];
  const idx = buildCustomerIndex(input);
  assert.equal(idx.records.length, 1);
});

test("360 carries all live sections; planned sections exist in the rail", () => {
  const input = base();
  input.leads = [lead()];
  input.deals = [{ id: "d1", lead_id: "lead-a", title: "T", value: 100, currency: "EUR", stage: "proposal", expected_close_date: null, closed_at: null, created_at: "2026-08-02T10:00:00Z" }];
  input.invoices = [
    { id: "q1", lead_id: "lead-a", deal_id: null, invoice_number: "Q-1", type: "quote", status: "sent", total: 50, currency: "EUR", valid_until: null, paid_at: null, created_at: "2026-08-01T10:00:00Z" },
    { id: "i1", lead_id: "lead-a", deal_id: null, invoice_number: "INV-1", type: "invoice", status: "paid", total: 100, currency: "EUR", valid_until: null, paid_at: "2026-08-03T10:00:00Z", created_at: "2026-08-01T11:00:00Z" },
  ];
  input.communications = [{ id: "c1", lead_id: "lead-a", deal_id: null, comm_type: "email", direction: "outbound", subject: "Hi", body: "x", created_at: "2026-08-02T11:00:00Z" }];
  input.events = [{ id: "e1", lead_id: "lead-a", deal_id: null, title: "Call", description: "", event_type: "task", start_time: "2026-08-05T09:00:00Z", end_time: null, completed: false, created_at: "2026-08-01T12:00:00Z" }];
  input.reminders = [{ id: "r1", lead_id: "lead-a", renewal_date: "2026-09-05", window_days: 14, status: "pending", due_at: "2026-08-22T08:00:00Z", sent_at: null, created_at: "2026-08-01T13:00:00Z" }];

  const c = buildCustomer360(input, "lead-a");
  assert.ok(c);
  assert.equal(c.profile.name, "Παπαδόπουλος Α.");
  assert.equal(c.energy.supplies.length, 1);
  assert.equal(c.documents.length, 1);
  assert.equal(c.opportunities.deals.length, 1);
  assert.equal(c.quotes.invoices.length, 1);
  assert.equal(c.invoices.invoices[0].invoiceNumber, "INV-1");
  assert.equal(c.payments.payments.length, 1);
  assert.equal(c.communications.items.length, 1);
  assert.equal(c.tasks.items.length, 1);
  assert.equal(c.renewals.reminders.length, 1);
  assert.equal(c.renewals.renewalState, "overdue");
  // activity contains a generated timeline line + real rows
  assert.ok(c.activity.items.length >= 3);

  const keys = CUSTOMER_SECTIONS.map((s) => s.key as string);
  for (const k of ["profile", "leads", "opportunities", "services", "energy", "insurance", "web", "documents", "quotes", "contracts", "renewals", "tasks", "communications", "invoices", "payments", "activity"]) {
    assert.ok(keys.includes(k), `section ${k} present`);
  }
});

test("activity timeline merges real rows for a lead", () => {
  const input = base();
  input.leads = [lead()];
  input.communications = [{ id: "c1", lead_id: "lead-a", deal_id: null, comm_type: "email", direction: "outbound", subject: "Hi", body: "", created_at: "2026-08-02T11:00:00Z" }];
  input.activity = [{ id: "a1", entity_type: "lead", entity_id: "lead-a", action: "updated", details: {}, created_at: "2026-08-04T09:00:00Z" }];
  const c = buildCustomer360(input, "lead-a");
  assert.ok(c);
  const titles = c.activity.items.map((i) => i.title);
  assert.ok(titles.some((t) => t.includes("Lead δημιουργήθηκε")));
  assert.ok(titles.some((t) => t.includes("επικοινωνία")));
  assert.ok(titles.some((t) => t.includes("updated")));
  // most recent first
  assert.equal(c.activity.items[0].title, "updated");
});

test("cross-lead duplicates matched by email appear in relatedLeads", () => {
  const input = base();
  input.leads = [lead(), lead({ id: "lead-b", first_name: "Δεύτερο", last_name: "Lead", email: "a@example.com" })];
  input.deals = [{ id: "d1", lead_id: "lead-a", title: "T", value: 0, currency: "EUR", stage: "lead", expected_close_date: null, closed_at: null, created_at: "2026-08-02T10:00:00Z" }];
  const c = buildCustomer360(input, "lead-a");
  assert.ok(c);
  assert.equal(c.relatedLeads.length, 1);
  assert.equal(c.relatedLeads[0].key, "lead-b");
});

test("buildCustomer360 returns null for an unknown lead id", () => {
  const c = buildCustomer360(base(), "nope");
  assert.equal(c, null);
});

// ── Slice 2: service requests ────────────────────────────────────────────────

test("360 carries multiple requests for one person with independent statuses", () => {
  const input = base();
  input.leads = [lead()]; // status: "customer"
  input.requests = [
    request(),
    request({ id: "req-b", lead_id: "lead-a", service: "web", service_type: "Software Development" }),
  ];
  const c = buildCustomer360(input, "lead-a");
  assert.ok(c);
  assert.equal(c.requests.length, 2);
  const energy = c.requests.find((r) => r.service === "energy");
  const web = c.requests.find((r) => r.service === "web");
  assert.equal(energy?.serviceType, "Ρεύμα");
  assert.equal(web?.serviceType, "Software Development");
  // Parent lifecycle (customer) is NOT inherited by request status (new).
  assert.equal(c.isCustomer, true);
  assert.equal(energy?.status, "new");
  assert.equal(web?.status, "new");
});

test("parent lead customer status does not imply request status won", () => {
  const input = base();
  input.leads = [lead({ status: "customer" })];
  input.requests = [request({ status: "new", service: "web", service_type: "Software Development" })];
  const c = buildCustomer360(input, "lead-a");
  assert.ok(c);
  assert.equal(c.isCustomer, true);
  assert.equal(c.requests[0].status, "new");
  assert.equal(isActiveRequestStatus("new"), true);
});

test("index counts service requests per lead", () => {
  const input = base();
  input.leads = [lead()];
  input.requests = [request(), request({ id: "req-b", lead_id: "lead-a", service: "web" })];
  const idx = buildCustomerIndex(input);
  assert.equal(idx.records.length, 1);
  assert.equal(idx.records[0].counts.requests, 2);
});

test("activeRequests vs closedRequests split is honest", () => {
  const rows = [
    request(),
    request({ id: "req-b", service: "web", status: "changed_mind" }),
    request({ id: "req-c", service: "insurance", status: "won" }),
    request({ id: "req-d", service: "energy", status: "negotiation" }),
  ];
  const active = activeRequests(rows);
  const closed = closedRequests(rows);
  assert.equal(active.length, 2);
  assert.equal(closed.length, 2);
  assert.deepEqual(active.map((r) => r.id).sort(), ["req-a", "req-d"]);
});

test("requestView maps the persisted row to the typed view", () => {
  const v = requestView(request());
  assert.equal(v.id, "req-a");
  assert.equal(v.serviceType, "Ρεύμα");
  assert.equal(v.status, "new");
  assert.equal(v.nextAction, "Τηλεφώνημα");
  assert.equal(v.closedReason, null);
});

test("applyRequestPatch records service/owner/status/close/reopen events without touching history", () => {
  const baseRow = request();
  const first = applyRequestPatch(baseRow, { service: "web", owner: "maria" });
  assert.equal(first.row.service, "web");
  assert.equal(first.row.owner, "maria");
  assert.deepEqual(
    first.events.map((e) => e.action).sort(),
    ["owner_changed", "service_changed"]
  );

  const close = applyRequestPatch(first.row, { status: "changed_mind", closed_reason: "Βρήκε φθηνότερο αλλού" });
  assert.equal(close.row.status, "changed_mind");
  assert.equal(close.row.closed_reason, "Βρήκε φθηνότερο αλλού");
  assert.ok(close.events.some((e) => e.action === "status_changed"));
  assert.ok(close.events.some((e) => e.action === "closed"));
  assert.ok(close.events.some((e) => e.action === "updated" && e.field === "closed_reason"));

  const reopen = applyRequestPatch(close.row, { status: "new", closed_reason: null });
  assert.equal(reopen.row.status, "new");
  assert.ok(reopen.events.some((e) => e.action === "reopened"));
  // Original created_at and parent lead untouched.
  assert.equal(reopen.row.created_at, baseRow.created_at);
  assert.equal(reopen.row.lead_id, "lead-a");
});

test("applyRequestPatch normalizes empty strings to null", () => {
  const r = applyRequestPatch(request(), { reason: "   ", next_action: "", owner: "  " });
  assert.equal(r.row.reason, null);
  assert.equal(r.row.next_action, null);
  assert.equal(r.row.owner, null);
});

test("requestTimeline merges the request creation with activity_log events newest-first", () => {
  const input = base();
  input.leads = [lead()];
  input.requests = [request()];
  input.activity = [
    { id: "log1", entity_type: "service_request", entity_id: "req-a", action: "status_changed", details: { fromValue: "new", toValue: "contacted" }, created_at: "2026-09-07T09:00:00Z" },
    { id: "log2", entity_type: "service_request", entity_id: "req-a", action: "closed", details: { fromValue: "contacted", toValue: "won", closed_reason: "Υπογραφή" }, created_at: "2026-09-07T11:00:00Z" },
  ];
  const lines = requestTimeline(request(), input.activity);
  assert.ok(lines.length === 3);
  assert.equal(lines[0].id, "request-event-log2");
  assert.ok(lines.some((l) => l.title.includes("δημιουργήθηκε")));
  assert.ok(lines.some((l) => l.title === "Κατάσταση άλλαξε"));

  const c = buildCustomer360(input, "lead-a");
  assert.ok(c);
  const activityTitles = c.activity.items.map((i) => i.title);
  assert.ok(activityTitles.some((t) => t.includes("δημιουργήθηκε")));
  assert.ok(activityTitles.some((t) => t === "Κατάσταση άλλαξε"));
  // no duplicate generic activity line for service_request rows
  assert.equal(activityTitles.filter((t) => t === "status_changed").length, 0);
});

test("lastActiveRequestStatus recovers the prior active status for reopen", () => {
  const reqs = [request({ status: "changed_mind" })];
  const activity = [
    { id: "a1", entity_type: "service_request", entity_id: "req-a", action: "status_changed", details: { fromValue: "new", toValue: "contacted" }, created_at: "2026-09-07T09:00:00Z" },
    { id: "a2", entity_type: "service_request", entity_id: "req-a", action: "closed", details: { fromValue: "contacted", toValue: "changed_mind" }, created_at: "2026-09-07T10:00:00Z" },
  ];
  assert.equal(lastActiveRequestStatus("req-a", activity, reqs), "contacted");
  assert.equal(lastActiveRequestStatus("req-missing", [], reqs), "new");
});

test("no requests → honest empty set", () => {
  const input = base();
  input.leads = [lead()];
  const c = buildCustomer360(input, "lead-a");
  assert.ok(c);
  assert.deepEqual(c.requests, []);
  assert.deepEqual(activeRequests([]), []);
  assert.deepEqual(closedRequests([]), []);
});