import { test } from "node:test";
import assert from "node:assert/strict";
import {
  daysUntil,
  pickWindow,
  renewalIdempotencyKey,
  upcomingRenewals,
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