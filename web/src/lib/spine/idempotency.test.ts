import { test } from "node:test";
import assert from "node:assert/strict";
import { newIdempotencyKey, isValidIdempotencyKey } from "./idempotency.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test("newIdempotencyKey returns a valid UUID", () => {
  const k = newIdempotencyKey();
  assert.match(k, UUID_RE);
  assert.equal(isValidIdempotencyKey(k), true);
});

test("keys are unique", () => {
  const keys = new Set(Array.from({ length: 100 }, () => newIdempotencyKey()));
  assert.equal(keys.size, 100);
});

test("isValidIdempotencyKey rejects garbage", () => {
  assert.equal(isValidIdempotencyKey("not-a-uuid"), false);
  assert.equal(isValidIdempotencyKey(""), false);
  assert.equal(isValidIdempotencyKey(42), false);
  assert.equal(isValidIdempotencyKey(null), false);
  assert.equal(isValidIdempotencyKey(undefined), false);
});