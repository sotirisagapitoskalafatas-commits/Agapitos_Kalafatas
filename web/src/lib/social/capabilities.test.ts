import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SOCIAL_PLATFORMS,
  CAPABILITY_MATRIX,
  capabilityById,
  platformCapabilities,
  allPublishCapabilityIds,
  summarizeConnection,
} from "./capabilities.ts";

test("matrix covers every supported platform with unique capability ids", () => {
  for (const platform of SOCIAL_PLATFORMS) {
    const caps = CAPABILITY_MATRIX[platform];
    assert.ok(Array.isArray(caps) && caps.length > 0, `${platform} has capabilities`);
    const ids = caps.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, `${platform} ids unique`);
    for (const c of caps) {
      assert.ok(c.id && c.label && c.description, `${platform}: ${c.id} complete`);
      assert.equal(typeof c.publish, "boolean");
    }
  }
});

test("every publish flag is false-positive safe and ids are discoverable", () => {
  const publishIds = allPublishCapabilityIds();
  assert.ok(publishIds.includes("pages_publish"));
  assert.ok(publishIds.includes("content_publish"));
  assert.ok(!publishIds.includes("pages_read"));
  assert.ok(!publishIds.includes("insights_read"));
});

test("capabilityById and platformCapabilities are consistent", () => {
  assert.equal(capabilityById("facebook", "pages_read")?.label, "Read page");
  assert.equal(capabilityById("youtube", "videos_upload")?.publish, true);
  assert.equal(capabilityById("facebook", "not_a_cap"), undefined);
  assert.deepEqual(platformCapabilities("not_a_platform"), []);
});

test("summarizeConnection filters unknown ids and reports publish gating", () => {
  const s = summarizeConnection(
    "facebook",
    ["pages_read", "pages_publish", "nonsense"],
    ["pages_read", "pages_publish"]
  );
  assert.deepEqual(s.declared, ["pages_read", "pages_publish"]);
  assert.deepEqual(s.verified, ["pages_read", "pages_publish"]);
  assert.deepEqual(s.publishDeclared, ["pages_publish"]);
  assert.deepEqual(s.publishVerified, ["pages_publish"]);
  assert.equal(s.canPublishNow, false);
});

test("summarizeConnection is honest without verification", () => {
  const s = summarizeConnection("instagram", ["content_publish"], []);
  assert.deepEqual(s.verified, []);
  assert.equal(s.canPublishNow, false);
});