import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ackHtml,
  ackSubject,
  canAckLead,
  escapeHtml,
  normalizeLocale,
} from "./ack.ts";

test("canAckLead requires a real, not-yet-acknowledged email", () => {
  assert.equal(canAckLead({ email: "a@b.com" }), true);
  assert.equal(canAckLead({ email: null }), false);
  assert.equal(canAckLead({ email: "" }), false);
  assert.equal(canAckLead({ email: "a@b.cc" }), true);
  assert.equal(canAckLead({ email: "foo@placeholder.local" }), false);
  assert.equal(canAckLead({ email: "not-an-email" }), false);
  assert.equal(canAckLead({ email: "a@b.com", ack_sent_at: "2026-09-01T00:00:00Z" }), false);
});

test("normalizeLocale falls back to el", () => {
  assert.equal(normalizeLocale("el"), "el");
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("FR"), "fr");
  assert.equal(normalizeLocale("de"), "el");
  assert.equal(normalizeLocale(""), "el");
});

test("ackSubject is localized", () => {
  assert.match(ackSubject("el"), /Λάβαμε/);
  assert.match(ackSubject("en"), /received your request/i);
  assert.match(ackSubject("fr"), /demande/i);
});

test("escapeHtml escapes markup", () => {
  assert.equal(escapeHtml(`<a href="#">a & 'b' "c"</a>`), "&lt;a href=&quot;#&quot;&gt;a &amp; &#39;b&#39; &quot;c&quot;&lt;/a&gt;");
});

test("ackHtml escapes the customer name and greets in Greek by default", () => {
  const html = ackHtml("el", "<Maria>");
  assert.ok(html.includes("&lt;Maria&gt;"));
  assert.ok(html.includes("Ευχαριστούμε"));
  const en = ackHtml("en", "John");
  assert.ok(en.includes("Thank you"));
  assert.ok(en.includes("John"));
});