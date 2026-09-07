import { test } from "node:test";
import assert from "node:assert/strict";
import { transitionStatus, CREATIVE_FLOW } from "./types.ts";
import { stripJsonFence, parseJsonObject, scanPii, normalizeBrandChecks, defaultCompliance } from "./guards.ts";
import { buildImagePrompt, buildCopyMessages, buildGuardMessages, variantToText } from "./prompts.ts";
import { mimeToExt, safeAssetName } from "./storage.ts";

test("workflow FSM advances along the approved flow", () => {
  let s = transitionStatus("DRAFT", "generate");
  assert.equal(s, "AI_GENERATED");
  s = transitionStatus(s, "verify");
  assert.equal(s, "VERIFICATION");
  s = transitionStatus(s, "verified");
  assert.equal(s, "PENDING_APPROVAL");
  s = transitionStatus(s, "approve");
  assert.equal(s, "APPROVED");
  s = transitionStatus(s, "ready");
  assert.equal(s, "READY_TO_PUBLISH");
});

test("workflow FSM allows reject and rejects invalid transitions", () => {
  assert.equal(transitionStatus("PENDING_APPROVAL", "reject"), "REJECTED");
  assert.equal(transitionStatus("VERIFICATION", "reject"), "REJECTED");
  assert.throws(() => transitionStatus("DRAFT", "approve"));
  assert.throws(() => transitionStatus("APPROVED", "verify"));
  assert.throws(() => transitionStatus("REJECTED", "approve"));
  assert.equal(CREATIVE_FLOW[0], "DRAFT");
});

test("stripJsonFence extracts JSON from fenced and embedded output", () => {
  const fenced = '```json\n{"a":1}\n```';
  assert.equal(stripJsonFence(fenced), '{"a":1}');
  const embedded = "Here you go:\n{\"b\":[1,2]} trailing";
  assert.equal(stripJsonFence(embedded), '{"b":[1,2]}');
  assert.equal(parseJsonObject(fenced).a, 1);
  assert.equal(parseJsonObject("not json"), null);
});

test("scanPii finds emails, phones and IBANs but not normal copy", () => {
  const hit = scanPii([
    "Contact our team at john@example.com or call +30 697 769 1776.",
    "Payment via IBAN GR16 0110 1250 0000 0001 2300 695.",
  ]);
  assert.equal(hit.found, true);
  assert.ok(hit.matches.some((m) => m.includes("@example.com")));
  assert.ok(hit.matches.some((m) => m.includes("GR16")));

  const clean = scanPii(["Save energy with a new photovoltaic system today."]);
  assert.equal(clean.found, false);
});

test("buildImagePrompt embeds language, discipline and disclaimers", () => {
  const p = buildImagePrompt({
    concept: "photovoltaic panels on a Greek rooftop",
    language: "gr",
    tone: "warm",
    service: "energy",
    objective: "leads",
    audience: "homeowners",
  });
  assert.ok(p.includes("Greek"));
  assert.ok(p.includes("Agapitos Kalafatas"));
  assert.ok(p.includes("no fabricated statistics"));
  assert.ok(p.includes("no contact details"));
  assert.ok(p.includes("photovoltaic panels"));
});

test("buildCopyMessages returns system+user with platforms, rules and JSON shape", () => {
  const { system, user } = buildCopyMessages({
    campaign: { name: "PV Spring", objective: "leads", language: "gr" },
    imageDescription: "Rooftop solar install",
    platforms: ["facebook", "instagram"],
    languages: ["gr"],
    brandRules: ["prohibited_claims: no absolute claims"],
    stamp: "2026-09-08T00:00:00Z",
  });
  assert.ok(system.includes("prohibited_claims: no absolute claims"));
  assert.ok(system.includes("{\"variants\":"));
  assert.ok(user.includes("facebook, instagram"));
  assert.ok(user.includes("2026-09-08T00:00:00Z"));
  assert.ok(user.includes("Rooftop solar install"));
});

test("buildGuardMessages carries rules and asks for human review flags", () => {
  const { system, user } = buildGuardMessages({
    assetText: "[facebook/en] headline",
    brandRules: ["brand_voice: warm and factual"],
    complianceRules: ["compliance: insurance is regulated"],
  });
  assert.ok(system.includes("needs_human_review"));
  assert.ok(user.includes("brand_voice: warm and factual"));
  assert.ok(user.includes("insurance is regulated"));
});

test("variantToText serializes a variant without losing fields", () => {
  const text = variantToText({
    platform: "instagram",
    language: "en",
    headline: "Hi",
    cta: "Learn more",
    hashtags: ["#solar", "#gr"],
  });
  assert.ok(text.includes("[instagram/en]"));
  assert.ok(text.includes("headline: Hi"));
  assert.ok(text.includes("#solar"));
  assert.ok(!text.includes("primary:"));
});

test("normalizeBrandChecks coerces severity and flags short coverage", () => {
  const checks = normalizeBrandChecks(
    [
      { rule_type: "brand_voice", rule_name: "voice", passed: true, severity: "bogus", note: "ok" },
      { rule_type: "prohibited_claims", rule_name: "claims", passed: false, note: "overclaim" },
    ],
    3
  );
  assert.equal(checks.length, 3);
  assert.equal(checks[0].severity, "info");
  assert.equal(checks[1].severity, "warning");
  assert.equal(checks[2].rule_name, "coverage");
  assert.equal(checks[2].passed, false);

  const empty = normalizeBrandChecks(null, 1);
  assert.equal(empty[0].severity, "warning");
});

test("defaultCompliance is conservative", () => {
  const c = defaultCompliance();
  assert.equal(c.needs_human_review, true);
  assert.deepEqual(c.flags, []);
});

test("mimeToExt and safeAssetName", () => {
  assert.equal(mimeToExt("image/jpeg"), "jpg");
  assert.equal(mimeToExt("image/webp"), "webp");
  assert.equal(mimeToExt("image/png"), "png");
  assert.equal(mimeToExt("application/octet-stream"), "png");
  assert.equal(safeAssetName("  PV — Spring '26  !! "), "pv-spring-26");
  assert.equal(safeAssetName("!!!"), "creative");
});