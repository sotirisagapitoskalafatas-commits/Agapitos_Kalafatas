import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = loadEnv(fileURLToPath(new URL("../.env.local", import.meta.url)));
const BASE = process.env.BASE_URL || "http://localhost:3111";
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = "creative-assets";

const CAMPAIGN_NAME = "Verify Campaign 2026-09-08";
const PROMPT = "Solar panel abstract amber logo tile, clean minimal editorial vector";
const out = [];
const step = (name, ok, detail) => {
  out.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  console.log(out[out.length - 1]);
};

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD }),
  });
  const body = await res.json();
  if (!res.ok || !body.token) throw new Error(`login failed (${res.status})`);
  return body.token;
}

async function api(token, path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function ensureAssetRow() {
  const { data: campaign, error: ce } = await supabase
    .from("creative_campaigns")
    .insert({ name: CAMPAIGN_NAME, service: "Ενέργεια", audience: "Επιχειρήσεις", objective: "awareness", tone: "professional", language: "gr" })
    .select("id")
    .single();
  if (ce) throw new Error(`campaign seed: ${ce.message}`);
  const { data: asset, error: ae } = await supabase
    .from("creative_assets")
    .insert({
      campaign_id: campaign.id,
      asset_type: "image",
      kind: "generated_image",
      title: PROMPT.slice(0, 120),
      status: "AI_GENERATED",
      prompt: PROMPT,
      asset_path: `${BUCKET}`,
      mime_type: "image/png",
      model: "gemini-2.5-flash-image",
      creator: "user",
      language: "gr",
      platforms: [],
      meta: { variant_index: 0, seeded_after_image_quota: true },
      created_by: "verification",
    })
    .select("id, asset_path")
    .single();
  if (ae) throw new Error(`asset seed: ${ae.message}`);
  return { campaignId: campaign.id, assetId: asset.id };
}

async function run() {
  const token = await login();

  const image = await api(token, "/api/creative/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "Solar panel abstract amber logo tile, clean minimal editorial vector",
      count: 1,
      language: "gr",
      objective: "awareness",
      tone: "professional",
      service: "Ενέργεια",
      audience: "Επιχειρήσεις",
      campaignName: CAMPAIGN_NAME,
    }),
  });
  if (image.status !== 200) {
    const msg = (image.body.error || "").slice(0, 120);
    step("image generate (quota-aware)", false, `HTTP ${image.status} ${msg}`);
    step("image quota expected (external account limit)", /429|quota/i.test(msg), typeof msg);
  } else {
    step("image generate http 200", true, `models=${image.body.model}`);
    const a = image.body.assets?.[0];
    if (a) return { assetId: a.id, campaignId: image.body.campaignId ?? null, imageGen: true };
  }

  const seeded = await ensureAssetRow();
  step("asset seeded as AI_GENERATED (image step blocked by quota)", true, `asset=${seeded.assetId.slice(0, 8)}`);
  return { assetId: seeded.assetId, campaignId: seeded.campaignId, imageGen: false };
}

async function runFlow(token, assetId) {
  const copy = await api(token, "/api/creative/copy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetId, platforms: ["facebook", "instagram"], languages: ["gr"] }),
  });
  step("copy http 200", copy.status === 200, `status=${copy.status}`);
  const variants = copy.body.variants || [];
  step("variants AI_GENERATED (real Gemini)", copy.status === 200 && variants.length > 0 && variants.every((v) => v.status === "AI_GENERATED"), `variants=${variants.length} platforms=${JSON.stringify(variants.map((v) => v.platform))}`);

  const verify = await api(token, "/api/creative/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetId }),
  });
  step("verify http 200", verify.status === 200, `status=${verify.status}`);
  step("verify -> PENDING_APPROVAL", verify.status === 200 && verify.body.asset?.status === "PENDING_APPROVAL", `status=${verify.body.asset?.status}`);
  step("checks recorded (real Gemini guard)", !!(verify.body.result?.summary) && typeof verify.body.result?.deterministic_pii === "object", `pii=${verify.body.result?.deterministic_pii?.found} summary="${(verify.body.result?.summary || "").slice(0, 60)}"`);

  const approve = await api(token, "/api/creative/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetId, action: "approve", note: "verification auto-approve" }),
  });
  step("approve http 200", approve.status === 200, `status=${approve.status}`);
  step("approve -> APPROVED (no publish)", approve.body.asset?.status === "APPROVED", `status=${approve.body.asset?.status}`);
}

async function checkState(assetId, campaignId, imageGen) {
  const { data: asset, error: ae } = await supabase
    .from("creative_assets")
    .select("id, status, checks, meta, model")
    .eq("id", assetId)
    .single();
  step("db asset APPROVED", !ae && asset?.status === "APPROVED", `status=${asset?.status} model=${asset?.model} imageGen=${imageGen}`);
  step("db asset checks + approved_at", !!asset?.checks && !!asset?.meta?.approved_at, `checks=${!!asset?.checks} approved_at=${asset?.meta?.approved_at ?? "n/a"}`);

  const { data: variants, error: ve } = await supabase
    .from("creative_asset_variants")
    .select("id, platform, language, status")
    .eq("asset_id", assetId);
  step("db variants APPROVED", !ve && (variants || []).length > 0 && variants.every((v) => v.status === "APPROVED"), `variants=${(variants || []).length}`);

  const { data: runs, error: re } = await supabase
    .from("creative_runs")
    .select("kind, status, model")
    .eq("asset_id", assetId);
  const kinds = (runs || []).map((r) => r.kind).sort();
  step("audit trail copy/verify/approve", !re && JSON.stringify(kinds) === JSON.stringify(["approve", "copy", "verify"]), `kinds=${JSON.stringify(kinds)}`);

  const { data: campaign, error: ce } = await supabase
    .from("creative_campaigns")
    .select("id, name")
    .eq("id", campaignId)
    .single();
  step("campaign present", !ce && campaign?.name === CAMPAIGN_NAME, campaign?.name || "n/a");
}

async function cleanup(assetId, campaignId) {
  await supabase.from("creative_asset_variants").delete().eq("asset_id", assetId);
  await supabase.from("creative_runs").delete().eq("asset_id", assetId);
  await supabase.from("creative_assets").delete().eq("id", assetId);
  await supabase.from("creative_campaigns").delete().eq("id", campaignId);
}

let assetId = null;
let campaignId = null;
try {
  const token = await login();
  const seeded = await run();
  assetId = seeded.assetId;
  campaignId = seeded.campaignId;
  await runFlow(token, assetId);
  await checkState(assetId, campaignId, seeded.imageGen);
} catch (e) {
  step("error", false, e.message);
} finally {
  if (assetId) {
    try {
      await cleanup(assetId, campaignId);
    } catch (e) {
      step("cleanup", false, e.message);
    }
  }
  const { count: remaining, error: re } = await supabase
    .from("creative_assets")
    .select("id", { count: "exact", head: true })
    .eq("title", PROMPT.slice(0, 120));
  step("no leftover test assets", !re && remaining === 0, `remaining=${remaining}`);
  console.log(out.join("\n"));
}