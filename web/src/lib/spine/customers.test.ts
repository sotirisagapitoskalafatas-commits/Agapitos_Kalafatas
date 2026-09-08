import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomer360,
  buildCustomerIndex,
  CUSTOMER_SECTIONS,
  customerName,
  leadServices,
  renewalStateOf,
  type Customer360Input,
  type CustomerLeadRow,
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
    deals: [],
    invoices: [],
    communications: [],
    events: [],
    reminders: [],
    activity: [],
    now: NOW,
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