import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAttribution, sanitizeValue, emptyAttribution } from "./attribution.ts";

test("parseAttribution extracts UTM params and referrer", () => {
  const a = parseAttribution(
    "utm_source=google&utm_medium=cpc&utm_campaign=energy_q3&utm_term=kw&utm_content=btn_a",
    "https://www.google.com/",
    "/energy?utm_source=google"
  );
  assert.equal(a.utm_source, "google");
  assert.equal(a.utm_medium, "cpc");
  assert.equal(a.utm_campaign, "energy_q3");
  assert.equal(a.utm_term, "kw");
  assert.equal(a.utm_content, "btn_a");
  assert.equal(a.referrer, "https://www.google.com/");
  assert.equal(a.landing_path, "/energy?utm_source=google");
});

test("parseAttribution without params returns empty record", () => {
  const a = parseAttribution("");
  assert.deepEqual(a, emptyAttribution());
});

test("sanitizeValue trims and truncates to max", () => {
  assert.equal(sanitizeValue("  abc  "), "abc");
  assert.equal(sanitizeValue(""), null);
  assert.equal(sanitizeValue(null), null);
  assert.equal(sanitizeValue(undefined), null);
  assert.equal(sanitizeValue("x".repeat(600))!.length, 512);
  assert.equal(sanitizeValue("  spaced  ", 3), "spa");
});