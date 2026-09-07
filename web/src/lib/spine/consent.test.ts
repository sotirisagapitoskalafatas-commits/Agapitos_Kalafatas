import { test } from "node:test";
import assert from "node:assert/strict";
import { buildConsentRecord, CONSENT_VERSION } from "./consent.ts";

test("buildConsentRecord defaults to lead / v1 / not granted", () => {
  const r = buildConsentRecord({});
  assert.equal(r.entity_type, "lead");
  assert.equal(r.entity_id, null);
  assert.equal(r.email, null);
  assert.equal(r.granted, false);
  assert.equal(r.consent_version, CONSENT_VERSION);
  assert.equal(r.source, null);
  assert.deepEqual(r.details, {});
});

test("buildConsentRecord honors input and sanitizes tx metadata", () => {
  const r = buildConsentRecord({
    entityId: "11111111-1111-1111-1111-111111111111",
    email: "  lead@example.com  ",
    granted: true,
    consentVersion: "v2",
    source: "energy_form",
    ip: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    userAgent: "custom",
    details: { service_category: "Electricity" },
  });
  assert.equal(r.entity_id, "11111111-1111-1111-1111-111111111111");
  assert.equal(r.email, "lead@example.com");
  assert.equal(r.granted, true);
  assert.equal(r.consent_version, "v2");
  assert.equal(r.source, "energy_form");
  assert.equal(r.details.service_category, "Electricity");
});

test("buildConsentRecord truncates ip to 64 chars", () => {
  const r = buildConsentRecord({ ip: "a".repeat(200) });
  assert.equal(r.ip!.length, 64);
});