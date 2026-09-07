// Prompt builders for the Creative Studio (image generation, ad copy, guards).

import type { CopyVariant } from "./types";

const BRAND_NAME = "Agapitos Kalafatas";
const BRAND_BRIEF =
  "Technology & digital services (websites, e-shops, SaaS, AI agents), energy (electricity, gas, photovoltaics, EV charging) and insurance (life, health, car, home). " +
  "Visual style: slate + amber palette, clean modern layout, concrete professional atmosphere.";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  gr: "Greek",
  fr: "French",
};

export function buildImagePrompt(opts: {
  concept: string;
  language?: string;
  tone?: string;
  objective?: string;
  service?: string;
  audience?: string;
  extraInstructions?: string[];
}): string {
  const lines: string[] = [];
  lines.push(
    `Create an advertising/marketing image for ${BRAND_NAME}. ${BRAND_BRIEF}`
  );
  if (opts.service) lines.push(`Service/offer depicted: ${opts.service}.`);
  if (opts.audience) lines.push(`Target audience: ${opts.audience}.`);
  if (opts.objective) lines.push(`Campaign objective: ${opts.objective}.`);
  if (opts.tone) lines.push(`Tone: ${opts.tone}.`);
  if (opts.language && LANGUAGE_NAMES[opts.language]) {
    lines.push(
      `Any visible text in the image must be in ${LANGUAGE_NAMES[opts.language]}.`
    );
  }
  lines.push("Image dimensions/style: photorealistic or clean illustration, no clutter, strong focal subject.");
  lines.push("DISCLAIMERS: no fabricated statistics, prices or client claims; no brand name " +
    "spelling mistakes; no contact details, phone numbers or emails rendered in the image.");
  lines.push(`Core concept: ${opts.concept}`);
  for (const extra of opts.extraInstructions || []) lines.push(`Additional requirement: ${extra}`);
  return lines.join("\n");
}

export function copyFormatInstruction(): string {
  return (
    "Return ONLY a single JSON object (no markdown fences, no commentary) with shape: " +
    '{"variants":[{"platform":"facebook|instagram|youtube|tiktok|linkedin|web|generic",' +
    '"language":"en|gr|fr","headline":"string","primary_text":"string","short_text":"string",' +
    '"cta":"string","hashtags":["string"],"alt_text":"string"}]}'
  );
}

const PLATFORM_FORMAT: Record<string, string> = {
  facebook: "Conversational primary text with a short headline and a clear CTA.",
  instagram: "Short, visual text with hashtags; CTA in caption.",
  youtube: "Title + longer description with a clear CTA.",
  tiktok: "Very short, energetic hook text with 3-5 hashtags.",
  linkedin: "Professional, business tone; insight-led primary copy, mention the service value.",
  web: "Single generic copy block usable on the website.",
  generic: "Balanced universal copy.",
};

export function buildCopyMessages(input: {
  campaign?: {
    name?: string;
    service?: string;
    audience?: string;
    objective?: string;
    tone?: string;
    language?: string;
  };
  imageDescription?: string;
  platforms: string[];
  languages: string[];
  brandRules: string[];
  stamp: string;
}): { system: string; user: string } {
  const brand = input.brandRules.length
    ? input.brandRules.join("\n")
    : "Professional, warm, concrete and concise. No absolute or unprovable claims.";

  const platformNotes = input.platforms
    .map((p) => `- ${p}: ${PLATFORM_FORMAT[p] || PLATFORM_FORMAT.generic}`)
    .join("\n");

  const system = [
    `You are the senior ad copywriter for ${BRAND_NAME} (web/digital, energy, insurance).`,
    `Brand rules:\n${brand}`,
    "Every variant must be factually safe (no invented stats/prices), have exactly one clear CTA, and match its language exactly.",
    `Per-platform format:\n${platformNotes}`,
    copyFormatInstruction(),
  ].join("\n\n");

  const user = [
    `Campaign: ${input.campaign?.name || "Untitled campaign"}`,
    input.campaign?.service ? `Service: ${input.campaign.service}` : "",
    input.campaign?.audience ? `Audience: ${input.campaign.audience}` : "",
    input.campaign?.objective ? `Objective: ${input.campaign.objective}` : "",
    input.campaign?.tone ? `Tone: ${input.campaign.tone}` : "",
    input.campaign?.language && LANGUAGE_NAMES[input.campaign.language]
      ? `Primary language: ${LANGUAGE_NAMES[input.campaign.language]}`
      : "",
    input.imageDescription ? `Image this copy accompanies: ${input.imageDescription}` : "",
    `Generate variants for platforms [${input.platforms.join(", ")}] in languages [${input.languages.join(", ")}].`,
    `Fresh-generation stamp (do not repeat cached output): ${input.stamp}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export function buildGuardMessages(opts: {
  assetText: string;
  brandRules: string[];
  complianceRules: string[];
}): { system: string; user: string } {
  const system = [
    "You are the Brand Guardian and Compliance Guardian for Agapitos Kalafatas marketing assets.",
    "Evaluate the supplied copy against the active rules and flag regulated insurance/financial/energy claims for human review.",
    "Output ONLY a single JSON object (no fences):",
    '{"brand_checks":[{"rule_type":"string","rule_name":"string","passed":boolean,"severity":"blocking|warning|info","note":"string"}],',
    '"compliance":{"needs_human_review":boolean,"flags":[{"domain":"insurance|financial|energy","claim":"string","recommendation":"string"}]},',
    '"summary":"string"}',
    "Severity: blocking for prohibited/absolute claims or regulated claim risks; warning for style; info for suggestions.",
  ].join("\n");

  const user = [
    "ACTIVE BRAND RULES:",
    opts.brandRules.length ? opts.brandRules.join("\n") : "(none)",
    "ACTIVE COMPLIANCE RULES:",
    opts.complianceRules.length ? opts.complianceRules.join("\n") : "(none)",
    "ASSET COPY TO REVIEW:",
    opts.assetText || "(image-only asset; review the caption)", 
  ].join("\n");

  return { system, user };
}

export function variantToText(v: CopyVariant): string {
  return [
    `[${v.platform}/${v.language}]`,
    v.headline ? `headline: ${v.headline}` : "",
    v.primary_text ? `primary: ${v.primary_text}` : "",
    v.short_text ? `short: ${v.short_text}` : "",
    v.cta ? `cta: ${v.cta}` : "",
    v.hashtags?.length ? `hashtags: ${v.hashtags.join(" ")}` : "",
    v.alt_text ? `alt: ${v.alt_text}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}