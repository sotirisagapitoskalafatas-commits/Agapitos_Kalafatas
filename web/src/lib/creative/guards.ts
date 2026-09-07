// Brand/Compliance/Deterministic guards. Pure helpers + LLM wrapper.

import type { VerificationResult, BrandCheck } from "./types";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const IBAN_RE = /\b[A-Z]{2}[0-9]{2}(?: ?[0-9A-Z]{4}){4,10}\b/g;
const PHONE_RE = /\+\d[\d\s().-]{7,}\d/g;
const GREEK_PHONE_RE = /\b(?:2|6|69)\d[\d\s()]{6,}\d/g;

export function stripJsonFence(raw: string): string {
  let s = raw.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) return fence[1].trim();
  const open = s.indexOf("{");
  const close = s.lastIndexOf("}");
  if (open >= 0 && close > open) return s.slice(open, close + 1);
  return s;
}

export function parseJsonObject<T>(raw: string): T | null {
  try {
    return JSON.parse(stripJsonFence(raw)) as T;
  } catch {
    return null;
  }
}

export function scanPii(texts: string[]): { found: boolean; matches: string[] } {
  const matches = new Set<string>();
  for (const text of texts) {
    if (!text) continue;
    for (const re of [EMAIL_RE, IBAN_RE, PHONE_RE, GREEK_PHONE_RE]) {
      re.lastIndex = 0;
      const it = text.matchAll(re);
      let m = it.next();
      while (!m.done) {
        matches.add(m.value[0]);
        m = it.next();
      }
    }
  }
  const list = Array.from(matches);
  return { found: list.length > 0, matches: list };
}

export function normalizeBrandChecks(checks: unknown, rulesCount: number): BrandCheck[] {
  if (!Array.isArray(checks)) {
    return [
      {
        rule_type: "guard",
        rule_name: "brand_guard",
        passed: false,
        severity: "warning",
        note: "Guard returned no structured checks.",
      },
    ];
  }
  const normalized: BrandCheck[] = [];
  for (const c of checks as any[]) {
    if (typeof c !== "object" || c === null) continue;
    const passed = c.passed === true;
    const severity = ["blocking", "warning", "info"].includes(c.severity)
      ? c.severity
      : passed
      ? "info"
      : "warning";
    normalized.push({
      rule_type: String(c.rule_type || "rule"),
      rule_name: String(c.rule_name || "unnamed"),
      passed,
      severity: severity as BrandCheck["severity"],
      note: typeof c.note === "string" ? c.note : undefined,
    });
  }
  if (normalized.length < rulesCount) {
    normalized.push({
      rule_type: "guard",
      rule_name: "coverage",
      passed: false,
      severity: "warning",
      note: `Guard evaluated ${normalized.length}/${rulesCount} rules.`,
    });
  }
  return normalized;
}

export function defaultCompliance(): VerificationResult["compliance"] {
  return { needs_human_review: true, flags: [] };
}