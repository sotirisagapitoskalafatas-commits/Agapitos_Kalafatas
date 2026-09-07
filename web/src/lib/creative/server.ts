// Creative Studio orchestration (server-side, service-role Supabase).
// Each operation records an append-only audit row in creative_runs.

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateImage, getModelClient } from "@/lib/agents/model-client";
import type { CopyVariant, MediaFilter, VerificationResult, WorkflowAction } from "./types";
import { transitionStatus, PLATFORMS, LANGUAGES } from "./types";
import {
  buildImagePrompt,
  buildCopyMessages,
  buildGuardMessages,
  variantToText,
} from "./prompts";
import { scanPii, parseJsonObject, normalizeBrandChecks, defaultCompliance } from "./guards";
import {
  CREATIVE_BUCKET,
  uploadBase64,
  publicUrl,
  mimeToExt,
} from "./storage";

type Rules = { brand: string[]; compliance: string[] };

export async function getActiveRules(client: SupabaseClient): Promise<Rules> {
  const { data, error } = await client
    .from("brand_rule")
    .select("rule_type, content")
    .eq("active", true);
  if (error) throw new Error(`brand_rule read failed: ${error.message}`);
  const brand: string[] = [];
  const compliance: string[] = [];
  for (const row of (data || []) as { rule_type: string; content: string }[]) {
    const line = `${row.rule_type}: ${row.content}`;
    if (row.rule_type === "compliance") compliance.push(line);
    else brand.push(line);
  }
  return { brand, compliance };
}

export async function ensureCampaign(
  client: SupabaseClient,
  input: {
    campaignId?: string;
    name?: string;
    service?: string;
    audience?: string;
    objective?: string;
    tone?: string;
    language?: string;
    createdBy?: string;
  }
): Promise<string | null> {
  if (input.campaignId) return input.campaignId;
  if (!input.name?.trim()) return null;

  const { data: existing } = await client
    .from("creative_campaigns")
    .select("id")
    .eq("name", input.name.trim())
    .eq("status", "active")
    .limit(1);

  if ((existing as { id: string }[] | null)?.length) {
    return (existing as { id: string }[])[0].id;
  }

  const { data, error } = await client
    .from("creative_campaigns")
    .insert({
      name: input.name.trim(),
      service: input.service || null,
      audience: input.audience || null,
      objective: input.objective || null,
      tone: input.tone || null,
      language: input.language || "en",
      created_by: input.createdBy || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`campaign create failed: ${error.message}`);
  return (data as { id: string }).id;
}

async function audit(
  client: SupabaseClient,
  row: {
    kind: "image" | "copy" | "verify" | "approve";
    assetId?: string | null;
    campaignId?: string | null;
    actor: string;
    actorRole?: string;
    prompt?: string | null;
    sourcePath?: string | null;
    outputPath?: string | null;
    model?: string | null;
    status?: string | null;
    result?: Record<string, unknown>;
    durationMs?: number | null;
  }
): Promise<void> {
  const { error } = await client.from("creative_runs").insert({
    kind: row.kind,
    asset_id: row.assetId ?? null,
    campaign_id: row.campaignId ?? null,
    actor: row.actor,
    actor_role: row.actorRole || "user",
    prompt: row.prompt ?? null,
    source_path: row.sourcePath ?? null,
    output_path: row.outputPath ?? null,
    model: row.model ?? null,
    status: row.status ?? null,
    result: row.result ?? {},
    duration_ms: row.durationMs ?? null,
  });
  if (error) throw new Error(`creative_runs insert failed: ${error.message}`);
}

export async function generateImageRun(
  client: SupabaseClient,
  opts: {
    user: string;
    prompt: string;
    count?: number;
    language?: string;
    objective?: string;
    tone?: string;
    service?: string;
    audience?: string;
    aspectRatio?: string;
    campaignId?: string;
    campaignName?: string;
    referenceImage?: { dataBase64?: string; mimeType?: string };
  }
): Promise<{ assets: any[]; model: string; caption: string | null }> {
  const started = Date.now();
  const campaignId = await ensureCampaign(client, {
    campaignId: opts.campaignId,
    name: opts.campaignName,
    service: opts.service,
    audience: opts.audience,
    objective: opts.objective,
    tone: opts.tone,
    language: opts.language,
    createdBy: opts.user,
  });

  let refDataBase64 = opts.referenceImage?.dataBase64;
  let refMime = opts.referenceImage?.mimeType || "image/png";
  let sourcePath: string | null = null;

  if (refDataBase64) {
    const ext = mimeToExt(refMime);
    const refContainer = `refs/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    await uploadBase64(client, CREATIVE_BUCKET, refContainer, refDataBase64, refMime);
    sourcePath = publicUrl(client, CREATIVE_BUCKET, refContainer);
  } else {
    refDataBase64 = undefined;
  }

  const concept = buildImagePrompt({
    concept: opts.prompt,
    language: opts.language,
    tone: opts.tone,
    objective: opts.objective,
    service: opts.service,
    audience: opts.audience,
  });

  const result = await generateImage({
    prompt: concept,
    referenceImages: refDataBase64
      ? [{ dataBase64: refDataBase64, mimeType: refMime }]
      : [],
    count: opts.count || 1,
    aspectRatio: opts.aspectRatio,
  });

  const assets: any[] = [];
  for (let i = 0; i < result.images.length; i++) {
    const img = result.images[i];
    const ext = mimeToExt(img.mimeType);
    const path = `images/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
    const url = await uploadBase64(client, CREATIVE_BUCKET, path, img.dataBase64, img.mimeType);

    const { data, error } = await client
      .from("creative_assets")
      .insert({
        campaign_id: campaignId,
        asset_type: "image",
        kind: "generated_image",
        title: opts.prompt.slice(0, 120),
        status: "AI_GENERATED",
        prompt: opts.prompt,
        source_path: sourcePath,
        asset_path: url,
        mime_type: img.mimeType,
        model: result.model,
        creator: "user",
        language: opts.language || null,
        platforms: [],
        meta: { variant_index: i },
        created_by: opts.user,
      })
      .select()
      .single();
    if (error) throw new Error(`creative_assets insert failed: ${error.message}`);
    assets.push(data);
  }

  await audit(client, {
    kind: "image",
    assetId: assets[0]?.id ?? null,
    campaignId,
    actor: opts.user,
    prompt: opts.prompt,
    sourcePath,
    outputPath: assets.map((a: any) => a.asset_path).join("\n"),
    model: result.model,
    status: "AI_GENERATED",
    result: { count: assets.length },
    durationMs: Date.now() - started,
  });

  return { assets, model: result.model, caption: result.caption };
}

export async function generateCopyRun(
  client: SupabaseClient,
  opts: {
    user: string;
    assetId: string;
    platforms: string[];
    languages: string[];
  }
): Promise<{ asset: any; variants: any[] }> {
  const started = Date.now();
  const { data: asset, error: assetError } = await client
    .from("creative_assets")
    .select("*")
    .eq("id", opts.assetId)
    .single();
  if (assetError || !asset) throw new Error("Asset not found");

  let campaign: any = null;
  if (asset.campaign_id) {
    const { data } = await client
      .from("creative_campaigns")
      .select("*")
      .eq("id", asset.campaign_id)
      .single();
    campaign = data;
  }

  const rules = await getActiveRules(client);
  const { system, user } = buildCopyMessages({
    campaign: {
      name: campaign?.name,
      service: campaign?.service,
      audience: campaign?.audience,
      objective: campaign?.objective,
      tone: campaign?.tone,
      language: campaign?.language || asset.language,
    },
    imageDescription: asset.meta?.image_caption || asset.title,
    platforms: opts.platforms,
    languages: opts.languages,
    brandRules: rules.brand,
    stamp: new Date().toISOString(),
  });

  const model = getModelClient("large");
  const res = await model.chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    []
  );

  const parsed = parseJsonObject<{ variants?: CopyVariant[] }>(res.content || "");
  if (!parsed?.variants?.length) {
    throw new Error("Copy generation returned unparseable output.");
  }

  const validPlatforms = opts.platforms.filter((p) =>
    (PLATFORMS as readonly string[]).includes(p)
  );
  const validLanguages = opts.languages.filter((l) =>
    (LANGUAGES as readonly string[]).includes(l)
  );

  await client.from("creative_asset_variants").delete().eq("asset_id", opts.assetId);

  const rows: any[] = [];
  for (const v of parsed.variants) {
    if (!validPlatforms.includes(v.platform) || !validLanguages.includes(v.language)) continue;
    const { data, error } = await client
      .from("creative_asset_variants")
      .insert({
        asset_id: opts.assetId,
        platform: v.platform,
        language: v.language,
        headline: v.headline || null,
        primary_text: v.primary_text || null,
        short_text: v.short_text || null,
        cta: v.cta || null,
        hashtags: v.hashtags || [],
        alt_text: v.alt_text || null,
        status: "AI_GENERATED",
      })
      .select()
      .single();
    if (error) throw new Error(`variant insert failed: ${error.message}`);
    rows.push(data);
  }

  const platforms = Array.from(new Set([...(asset.platforms || []), ...validPlatforms]));
  const { error: updateError } = await client
    .from("creative_assets")
    .update({
      platforms,
      meta: {
        ...(asset.meta || {}),
        languages: Array.from(
          new Set([...(asset.meta?.languages || []), ...validLanguages])
        ),
        copy_generated_at: new Date().toISOString(),
      },
    })
    .eq("id", opts.assetId);
  if (updateError) throw new Error(`asset update failed: ${updateError.message}`);

  await audit(client, {
    kind: "copy",
    assetId: opts.assetId,
    campaignId: asset.campaign_id,
    actor: opts.user,
    prompt: user,
    model: model.model,
    status: "AI_GENERATED",
    result: { platforms: validPlatforms, languages: validLanguages, count: rows.length },
    durationMs: Date.now() - started,
  });

  return { asset, variants: rows };
}

export async function verifyRun(
  client: SupabaseClient,
  opts: { user: string; assetId: string }
): Promise<{ asset: any; result: VerificationResult }> {
  const started = Date.now();
  const { data: asset, error: assetError } = await client
    .from("creative_assets")
    .select("*, variants:creative_asset_variants(*)")
    .eq("id", opts.assetId)
    .single();
  if (assetError || !asset) throw new Error("Asset not found");

  const nextStatus = transitionStatus(asset.status as any, "verify");
  const rules = await getActiveRules(client);

  const assetText = [
    ...((asset.variants as any[] | undefined) || []).map((v: any) => variantToText(v)),
    asset.meta?.image_caption ? `caption: ${asset.meta.image_caption}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const pii = scanPii([assetText]);
  const { system, user } = buildGuardMessages({
    assetText,
    brandRules: rules.brand,
    complianceRules: rules.compliance,
  });

  const model = getModelClient("large");
  const guardRes = await model.chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    []
  );
  const parsed = parseJsonObject<Partial<VerificationResult>>(guardRes.content || "");

  const result: VerificationResult = {
    brand_checks: normalizeBrandChecks(parsed?.brand_checks, rules.brand.length),
    compliance:
      parsed?.compliance && Array.isArray(parsed.compliance.flags)
        ? parsed.compliance
        : defaultCompliance(),
    deterministic_pii: pii,
    summary:
      parsed?.summary ||
      `Guards ran; ${pii.found ? "PII detected" : "no PII detected"}.`,
  };

  const finalStatus = transitionStatus(nextStatus, "verified");
  const { error: updateError } = await client
    .from("creative_assets")
    .update({
      status: finalStatus,
      checks: result,
      meta: {
        ...(asset.meta || {}),
        verification_at: new Date().toISOString(),
      },
    })
    .eq("id", opts.assetId);
  if (updateError) throw new Error(`asset update failed: ${updateError.message}`);

  await audit(client, {
    kind: "verify",
    assetId: opts.assetId,
    campaignId: asset.campaign_id,
    actor: opts.user,
    prompt: user,
    model: model.model,
    status: finalStatus,
    result: result as unknown as Record<string, unknown>,
    durationMs: Date.now() - started,
  });

  return { asset: { ...asset, status: finalStatus }, result };
}

export async function approveRun(
  client: SupabaseClient,
  opts: { user: string; assetId: string; action: "approve" | "reject"; note?: string }
): Promise<{ asset: any }> {
  const started = Date.now();
  const { data: asset, error: assetError } = await client
    .from("creative_assets")
    .select("*")
    .eq("id", opts.assetId)
    .single();
  if (assetError || !asset) throw new Error("Asset not found");

  const action: WorkflowAction = opts.action === "reject" ? "reject" : "approve";
  const finalStatus = transitionStatus(asset.status as any, action);

  const { error: updateError } = await client
    .from("creative_assets")
    .update({
      status: finalStatus,
      meta: {
        ...(asset.meta || {}),
        [opts.action === "reject" ? "rejected_at" : "approved_at"]: new Date().toISOString(),
        review_note: opts.note || null,
      },
    })
    .eq("id", opts.assetId);
  if (updateError) throw new Error(`asset update failed: ${updateError.message}`);

  const variantStatus = opts.action === "reject" ? "REJECTED" : "APPROVED";
  await client
    .from("creative_asset_variants")
    .update({ status: variantStatus })
    .eq("asset_id", opts.assetId);

  await audit(client, {
    kind: "approve",
    assetId: opts.assetId,
    campaignId: asset.campaign_id,
    actor: opts.user,
    status: finalStatus,
    result: { action: opts.action, note: opts.note || null },
    durationMs: Date.now() - started,
  });

  return { asset: { ...asset, status: finalStatus } };
}

export async function listMedia(
  client: SupabaseClient,
  filter: MediaFilter = {}
): Promise<any[]> {
  const limit = Math.min(filter.limit || 50, 200);
  let query = client
    .from("creative_assets")
    .select("*, variants:creative_asset_variants(*)")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (filter.type) query = query.eq("asset_type", filter.type);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.campaignId) query = query.eq("campaign_id", filter.campaignId);
  if (filter.q?.trim()) query = query.ilike("title", `%${filter.q.trim()}%`);

  const { data, error } = await query;
  if (error) throw new Error(`media list failed: ${error.message}`);
  return data || [];
}

export async function listCampaigns(client: SupabaseClient): Promise<any[]> {
  const { data, error } = await client
    .from("creative_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`campaign list failed: ${error.message}`);
  return data || [];
}

export async function listRules(client: SupabaseClient): Promise<any[]> {
  const { data, error } = await client
    .from("brand_rule")
    .select("*")
    .order("rule_type", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(`rule list failed: ${error.message}`);
  return data || [];
}