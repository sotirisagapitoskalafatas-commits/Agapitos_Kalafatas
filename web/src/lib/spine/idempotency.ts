import { randomUUID } from "node:crypto";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function newIdempotencyKey(): string {
  return randomUUID();
}

export function isValidIdempotencyKey(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v.trim());
}