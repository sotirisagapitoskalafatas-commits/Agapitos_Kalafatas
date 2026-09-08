import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildAttentionItems,
  buildCommandCenter,
  type CommandCenterInput,
} from "./command.ts";

const NOW = new Date("2026-09-08T12:00:00Z");

function base(): CommandCenterInput {
  return {
    leads: [],
    tasks: [],
    invoices: [],
    communications: [],
    approvals: [],
    agentAudit: [],
    notifications: [],
    creativeRuns: [],
    activity: [],
    deals: [],
    now: NOW,
  };
}

function lead(over: Partial<CommandCenterInput["leads"][number]> = {}): CommandCenterInput["leads"][number] {
  return {
    id: `lead-${Math.random().toString(36).slice(2, 8)}`,
    full_name: "Παπαδόπουλος Α.",
    first_name: null,
    last_name: null,
    client_name: null,
    email: "a@example.com",
    status: "customer",
    service_category: "Ρεύμα",
    source: "website",
    created_at: "2026-08-20T09:00:00Z",
    updated_at: "2026-08-20T09:00:00Z",
    renewal_date: null,
    provider: "ΔΕΗ",
    assigned_agent: "agapitos",
    ...over,
  };
}

test("overdue renewal becomes a critical attention item and counts", () => {
  const input = base();
  input.leads = [lead({ renewal_date: "2026-09-05" })];
  const cc = buildCommandCenter(input);
  assert.equal(cc.attention.total, 1);
  assert.equal(cc.attention.critical, 1);
  assert.equal(cc.attention.items[0].kind, "renewal_overdue");
  assert.equal(cc.attention.items[0].actions[0].target, "renewals");
  assert.equal(cc.vitals.renewals.overdue, 1);
  assert.deepEqual(cc.vitals.renewals, { overdue: 1, in14: 0, in30: 0 });
});

test("renewals due in 14/30 days land in the right buckets", () => {
  const input = base();
  input.leads = [
    lead({ renewal_date: "2026-09-10" }), // in 2 days -> in14
    lead({ renewal_date: "2026-09-25" }), // in 17 days -> in30
  ];
  const cc = buildCommandCenter(input);
  assert.equal(cc.vitals.renewals.in14, 1);
  assert.equal(cc.vitals.renewals.in30, 1);
  assert.equal(cc.attention.items.some((i) => i.kind === "renewal_due"), true);
});

test("invoice open for 14 days is high, 30 days is critical, finance totals honest", () => {
  const input = base();
  input.invoices = [
    {
      id: "inv1",
      invoice_number: "INV-2026-0113",
      type: "invoice",
      status: "sent",
      total: 1240,
      created_at: "2026-08-09T10:00:00Z", // 30 days before NOW
      paid_at: null,
    },
    {
      id: "inv2",
      invoice_number: "INV-2026-0112",
      type: "invoice",
      status: "accepted",
      total: 500,
      created_at: "2026-08-20T10:00:00Z", // 19 days -> high
      paid_at: null,
    },
    {
      id: "inv3",
      invoice_number: "INV-2026-0111",
      type: "quote",
      status: "sent",
      total: 900,
      created_at: "2026-07-01T10:00:00Z",
      paid_at: null,
    },
  ];
  const cc = buildCommandCenter(input);
  const items = cc.attention.items.filter((i) => i.kind === "invoice_overdue");
  assert.equal(items.length, 2);
  assert.equal(items.find((i) => i.entity === "INV-2026-0113")?.severity, "critical");
  assert.equal(items.find((i) => i.entity === "INV-2026-0112")?.severity, "high");
  assert.equal(cc.vitals.finance.open, 2);
  assert.equal(cc.vitals.finance.openAmount, 1740);
  assert.equal(cc.vitals.finance.overdue, 1);
  assert.equal(cc.vitals.finance.overdueAmount, 1240);
});

test("hot lead with no communication surfaces by age", () => {
  const input = base();
  input.leads = [
    lead({ status: "new_lead", full_name: "Γεωργίου Μ.", created_at: "2026-09-07T10:00:00Z" }), // 26h -> high
    lead({ status: "new_lead", full_name: "Κώστας", created_at: "2026-09-06T10:00:00Z" }), // 50h -> critical
    lead({ status: "new_lead", full_name: "Φρέσκο", created_at: "2026-09-08T09:00:00Z" }), // 3h -> no item
  ];
  const cc = buildCommandCenter(input);
  const hot = cc.attention.items.filter((i) => i.kind === "hot_lead");
  assert.equal(hot.length, 2);
  assert.equal(hot.find((i) => i.entity === "Κώστας")?.severity, "critical");
  assert.equal(hot.find((i) => i.entity === "Γεωργίου Μ.")?.severity, "high");
  assert.equal(cc.vitals.leads.uncontacted, 3);
});

test("a lead with a recorded communication is not hot", () => {
  const input = base();
  const l = lead({ status: "new_lead", created_at: "2026-09-06T10:00:00Z" });
  input.leads = [l];
  input.communications = [{ id: "c1", lead_id: l.id, comm_type: "phone", direction: "outbound", created_at: "2026-09-07T09:00:00Z" }];
  const cc = buildCommandCenter(input);
  assert.equal(cc.attention.items.some((i) => i.kind === "hot_lead"), false);
});

test("overdue tasks are medium, heavily overdue high", () => {
  const input = base();
  input.tasks = [
    { id: "t1", title: "Call Δημητρίου", event_type: "task", start_time: "2026-09-07T09:00:00Z", end_time: null, completed: false, lead_id: null },
    { id: "t2", title: "Παλιά εργασία", event_type: "task", start_time: "2026-09-02T09:00:00Z", end_time: null, completed: false, lead_id: null },
    { id: "t3", title: "Πρωινή εργασία", event_type: "task", start_time: "2026-09-08T09:00:00Z", end_time: null, completed: false, lead_id: null },
  ];
  const cc = buildCommandCenter(input);
  const items = cc.attention.items.filter((i) => i.kind === "overdue_task");
  assert.equal(items.length, 2);
  assert.equal(items.find((i) => i.entity === "Παλιά εργασία")?.severity, "high");
  assert.equal(items.find((i) => i.entity === "Call Δημητρίου")?.severity, "medium");
  assert.equal(cc.vitals.operations.overdue, 2);
  assert.equal(cc.vitals.operations.dueToday, 1);
});

test("pending approvals appear; expired ones do not", () => {
  const input = base();
  input.approvals = [
    {
      id: "ap1",
      agent_name: "Renewal Agent",
      action_type: "send_email",
      summary: "Send 8 renewal reminder emails",
      status: "pending",
      expires_at: "2026-09-10T00:00:00Z",
      created_at: "2026-09-08T08:00:00Z",
    },
    {
      id: "ap2",
      agent_name: "Agent",
      action_type: "do_thing",
      summary: "Expired approval",
      status: "pending",
      expires_at: "2026-09-01T00:00:00Z",
      created_at: "2026-08-30T08:00:00Z",
    },
  ];
  const cc = buildCommandCenter(input);
  const items = cc.attention.items.filter((i) => i.kind === "approval");
  assert.equal(items.length, 1);
  assert.equal(cc.vitals.ai.pendingApprovals, 2);
  assert.equal(cc.jarvis.counts.awaitingApproval, 2);
});

test("failed creative runs in 24h surface as an incident; old ones ignored", () => {
  const input = base();
  input.creativeRuns = [
    { id: "cr1", kind: "image", status: "failed", result: {}, created_at: "2026-09-08T09:00:00Z" },
    { id: "cr2", kind: "image", status: "error", result: {}, created_at: "2026-09-07T13:00:00Z" },
    { id: "cr3", kind: "image", status: "failed", result: {}, created_at: "2026-09-05T09:00:00Z" },
  ];
  const cc = buildCommandCenter(input);
  const incident = cc.attention.items.find((i) => i.kind === "incident");
  assert.ok(incident);
  assert.equal(incident.severity, "high");
  assert.equal(incident.actions[0].target, "/admin/creative");
  assert.equal(cc.vitals.ai.failures24h, 2);
});

test("agent audit failures in 24h become an item", () => {
  const input = base();
  input.agentAudit = [
    { id: 1, agent_name: "reminder-agent", output_summary: "Error reaching provider", tier: "free", duration_ms: 1200, created_at: "2026-09-08T10:00:00Z" },
    { id: 2, agent_name: "ok-agent", output_summary: "All good", tier: "free", duration_ms: 300, created_at: "2026-09-08T11:00:00Z" },
    { id: 3, agent_name: "old", output_summary: "Error old", tier: "free", duration_ms: 100, created_at: "2026-09-01T10:00:00Z" },
  ];
  const cc = buildCommandCenter(input);
  const fails = cc.attention.items.filter((i) => i.kind === "agent_failure");
  assert.equal(fails.length, 1);
  assert.equal(fails[0].entity, "reminder-agent");
  assert.equal(cc.vitals.ai.failures24h, 1);
  assert.equal(cc.vitals.ai.runs24h, 2);
});

test("weighted pipeline uses stage probabilities", () => {
  const input = base();
  input.deals = [
    { id: "d1", stage: "negotiation", value: 10000, currency: "EUR", created_at: "2026-08-01T00:00:00Z" },
    { id: "d2", stage: "proposal", value: 8000, currency: "EUR", created_at: "2026-08-02T00:00:00Z" },
    { id: "d3", stage: "closed_won", value: 5000, currency: "EUR", created_at: "2026-08-03T00:00:00Z" },
    { id: "d4", stage: "closed_lost", value: 9999, currency: "EUR", created_at: "2026-08-04T00:00:00Z" },
  ];
  const cc = buildCommandCenter(input);
  assert.equal(cc.vitals.pipeline.count, 2);
  assert.equal(cc.vitals.pipeline.weighted, 10000 * 0.8 + 8000 * 0.6);
  assert.equal(cc.vitals.pipeline.byStage["negotiation"], 1);
  assert.equal(cc.vitals.pipeline.byStage["proposal"], 1);
});

test("attention items rank critical before high before medium", () => {
  const input = base();
  input.leads = [
    lead({ status: "new_lead", full_name: "Hot Γρήγορο", created_at: "2026-09-06T10:00:00Z" }), // hot critical (50h)
    lead({ renewal_date: "2026-09-03" }), // renewal overdue critical
  ];
  input.tasks = [{ id: "t1", title: "Μέτρια εργασία", event_type: "task", start_time: "2026-09-07T09:00:00Z", end_time: null, completed: false, lead_id: null }];
  const cc = buildCommandCenter(input);
  const order = cc.attention.items.map((i) => i.severity);
  assert.equal(order[0], "critical");
  assert.equal(order[1], "critical");
  assert.equal(order[2], "medium");
});

test("operations today buckets are computed from start_time", () => {
  const input = base();
  input.tasks = [
    { id: "t1", title: "Σήμερα", event_type: "task", start_time: "2026-09-08T10:00:00Z", end_time: null, completed: false, lead_id: null },
    { id: "t2", title: "Ολοκληρωμένη σήμερα", event_type: "task", start_time: "2026-09-08T09:00:00Z", end_time: null, completed: true, lead_id: null },
    { id: "t3", title: "Χτες ανοιχτή", event_type: "reminder", start_time: "2026-09-07T10:00:00Z", end_time: null, completed: false, lead_id: null },
  ];
  const cc = buildCommandCenter(input);
  assert.equal(cc.vitals.operations.dueToday, 1);
  assert.equal(cc.vitals.operations.doneToday, 1);
  assert.equal(cc.vitals.operations.overdue, 1);
});

test("communications counted for the current month", () => {
  const input = base();
  input.communications = [
    { id: "c1", lead_id: null, comm_type: "email", direction: "inbound", created_at: "2026-09-03T09:00:00Z" },
    { id: "c2", lead_id: null, comm_type: "phone", direction: "outbound", created_at: "2026-08-20T09:00:00Z" },
  ];
  const cc = buildCommandCenter(input);
  assert.equal(cc.vitals.comms.thisMonth, 1);
  assert.equal(cc.vitals.comms.inbound, 1);
});

test("empty system reports honest foundations, not invented numbers", () => {
  const cc = buildCommandCenter(base());
  assert.equal(cc.attention.total, 0);
  assert.equal(cc.attention.critical, 0);
  assert.deepEqual(cc.vitals.finance, { open: 0, openAmount: 0, overdue: 0, overdueAmount: 0, paid30d: 0, paid30dAmount: 0 });
  assert.equal(cc.vitals.pipeline.weighted, 0);
  assert.deepEqual(cc.jarvis.changed, []);
  assert.deepEqual(cc.jarvis.atRisk, []);
  assert.equal(cc.jarvis.status, "foundation");
  assert.equal(cc.jarvis.next, null);
  assert.equal(cc.jarvis.counts.awaitingApproval, 0);
});

test("jarvis next maps to the top attention item and stays rule-based", () => {
  const input = base();
  input.leads = [lead({ renewal_date: "2026-09-05", provider: "ΔΕΗ" })];
  const cc = buildCommandCenter(input);
  assert.ok(cc.jarvis.next);
  assert.equal(cc.jarvis.next.title, cc.attention.items[0].title);
  assert.equal(cc.jarvis.next.actionTarget, "renewals");
  assert.equal(cc.jarvis.atRisk.length, 1);
  assert.match(cc.jarvis.note, /orchestration is not enabled/i);
});

test("buildAttentionItems is deterministic under equal inputs", () => {
  const a = buildAttentionItems(base());
  const b = buildAttentionItems(base());
  assert.deepEqual(a, b);
});