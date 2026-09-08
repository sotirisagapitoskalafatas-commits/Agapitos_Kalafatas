import { test } from "node:test";
import assert from "node:assert/strict";
import {
  daysUntil,
  pickWindow,
  renewalIdempotencyKey,
  upcomingRenewals,
  overdueRenewals,
  ownerEmailCandidates,
  RENEWAL_WINDOWS,
} from "./renewal.ts";

const NOW = new Date("2026-09-08T12:00:00Z");

test("daysUntil computes 0 for today and n for future dates", () => {
  assert.equal(daysUntil("2026-09-08", NOW), 0);
  assert.equal(daysUntil("2026-09-13", NOW), 5);
  assert.equal(daysUntil("2026-09-02", NOW), -6);
  assert.equal(daysUntil(null, NOW), null);
  assert.equal(daysUntil("not-a-date", NOW), null);
});

test("pickWindow returns the tightest covering window at or above days left", () => {
  assert.equal(pickWindow("2026-09-18", NOW), 14); // 10 days <= 14
});

test("pickWindow uses the smallest window that covers the horizon", () => {
  assert.equal(pickWindow("2026-09-08", NOW), 1); // 0 days => 1
  assert.equal(pickWindow("2026-09-11", NOW), 3); // 3 days
  assert.equal(pickWindow("2026-09-15", NOW), 7); // 7 days
  assert.equal(pickWindow("2026-10-22", NOW), 60); // 44 days => 60
  assert.equal(pickWindow("2026-01-01", NOW), null); // far past
  assert.equal(pickWindow(null, NOW), null);
});

test("renewalIdempotencyKey is deterministic per (lead, date, window)", () => {
  const a = renewalIdempotencyKey("lead-1", "2026-12-01", 30);
  const b = renewalIdempotencyKey("lead-1", "2026-12-01", 30);
  const c = renewalIdempotencyKey("lead-1", "2026-12-01", 14);
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.equal(a, "renew:lead-1:2026-12-01:30");
});

test("upcomingRenewals filters, sorts, and groups within horizon", () => {
  const rows = [
    { id: "a", renewal_date: "2026-09-10", full_name: "A", email: "a@x.com", service_category: "Electricity" }, // 2 days
    { id: "b", renewal_date: "2026-10-01", full_name: "B", email: "b@x.com", service_category: "Insurance" }, // 23 days
    { id: "c", renewal_date: "2026-12-01", full_name: "C", email: "c@x.com", service_category: "Insurance" }, // beyond 30
    { id: "d", renewal_date: null, full_name: "D", email: null, service_category: null }, // no date
    { id: "e", renewal_date: "2026-08-30", full_name: "E", email: null, service_category: null }, // past
  ];
  const out = upcomingRenewals(rows, 30, NOW);
  assert.deepEqual(
    out.map((r) => r.leadId),
    ["a", "b"]
  );
  assert.equal(out[0].daysLeft, 2);
  assert.equal(out[0].window, 3); // 2 days <= 3
  assert.equal(out[1].daysLeft, 23);
  assert.equal(out[1].window, 30); // 23 <= 30
});

test("RENEWAL_WINDOWS is ordered ascending for pickWindow correctness", () => {
  const sorted = [...RENEWAL_WINDOWS].sort((x, y) => x - y);
  assert.deepEqual([...RENEWAL_WINDOWS], sorted);
});

// ── 12-day horizon scan coverage: a renewal in 12 days is captured by the
//    14-day scan window (the tightest window at or above the day count). ──
test("scan coverage: renewal in 12 days is picked by the 14-day window", () => {
  const d = daysUntil("2026-09-20", NOW); // 12 days from 2026-09-08
  assert.equal(d, 12);
  assert.equal(pickWindow("2026-09-20", NOW), 14);
});

// ── Overdue: direct query surface, never emitted by the scan. ──
test("overdueRenewals surfaces strictly-past renewals and ignores null/future", () => {
  const rows = [
    { id: "a", renewal_date: "2026-09-01", full_name: "A", email: "a@x.com", service_category: "Power" }, // 7 days overdue
    { id: "b", renewal_date: "2026-09-20", full_name: "B", email: "b@x.com", service_category: "Power" },  // future
    { id: "c", renewal_date: "2026-08-01", full_name: "C", email: "c@x.com", service_category: "Gas" },    // 38 days overdue
    { id: "d", renewal_date: null, full_name: "D", email: null, service_category: null },                   // no date
    { id: "e", renewal_date: "2026-09-08", full_name: "E", email: "e@x.com", service_category: "Power" },  // today (not overdue)
  ];
  const out = overdueRenewals(rows as any, NOW);
  assert.deepEqual(
    out.map((r) => r.leadId),
    ["c", "a"] // most overdue first
  );
  assert.equal(out[0].daysOverdue, 38);
  assert.equal(out[1].daysOverdue, 7);
});

test("overdueRenewals is empty when nothing is past the reference date", () => {
  const rows = [
    { id: "f", renewal_date: "2026-09-20" },
    { id: "g", renewal_date: "2026-09-08" }, // today
  ];
  assert.equal(overdueRenewals(rows as any, NOW).length, 0);
});

// ── Owner email eligibility: only materialized, <=7-day, still-ahead ──
//    reminders qualify; owner_email_sent_at guard lives in the DB query.
test("ownerEmailCandidates filters to materialized, window<=7, not-overdue", () => {
  const reminders = [
    // materialized, 7-day window, still ahead -> qualifies
    { id: "a", lead_id: "l1", renewal_date: "2026-09-10", window_days: 7, task_id: "t1", owner_email_sent_at: null, full_name: "A" },
    // no task yet -> excluded
    { id: "b", lead_id: "l2", renewal_date: "2026-09-10", window_days: 3, task_id: null, owner_email_sent_at: null, full_name: "B" },
    // window too wide -> excluded
    { id: "c", lead_id: "l3", renewal_date: "2026-09-15", window_days: 14, task_id: "t3", owner_email_sent_at: null, full_name: "C" },
    // overdue renewal -> excluded (never re-email after the date)
    { id: "d", lead_id: "l4", renewal_date: "2026-09-01", window_days: 3, task_id: "t4", owner_email_sent_at: null, full_name: "D" },
  ];
  const out = ownerEmailCandidates(reminders as any, NOW);
  assert.deepEqual(
    out.map((r) => r.id),
    ["a"]
  );
  assert.equal(out[0].daysLeft, 2);
});

test("ownerEmailCandidates keeps name null-safe when lead has no name", () => {
  const out = ownerEmailCandidates(
    [{ id: "x", lead_id: "l9", renewal_date: "2026-09-12", window_days: 7, task_id: "t9", owner_email_sent_at: null, full_name: null }],
    NOW
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].name, null);
});