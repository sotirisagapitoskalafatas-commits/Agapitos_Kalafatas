import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/agents/db";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";

const SAFE_COLUMNS =
  "id,company_name,vat_number,tax_office,address,bank_iban,notify_email,ga_measurement_id,ai_system_prompt,pipeline_stages";
const MAX_BODY_BYTES = 32 * 1024;

const ALLOWED_FIELDS = new Set([
  "company_name",
  "vat_number",
  "tax_office",
  "address",
  "bank_iban",
  "notify_email",
  "ga_measurement_id",
  "ai_system_prompt",
  "pipeline_stages",
]);
const SECRET_FIELDS = new Set(["slack_webhook_url", "supabase_webhook_secret"]);

function noStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { data, error } = await supabase
    .from("system_settings")
    .select(`${SAFE_COLUMNS},slack_webhook_url,supabase_webhook_secret`)
    .eq("id", "default")
    .single();

  if (error && error.code !== "PGRST116") {
    return noStore({ error: "Unable to load settings" }, 500);
  }

  if (!data) {
    return noStore({
      id: "default",
      slack_webhook_configured: false,
      supabase_webhook_configured: false,
    });
  }

  const {
    slack_webhook_url: slackWebhookUrl,
    supabase_webhook_secret: supabaseWebhookSecret,
    ...safeData
  } = data;

  // Only configuration status crosses the API boundary; secret values never do.
  return noStore({
    ...safeData,
    slack_webhook_configured: Boolean(slackWebhookUrl),
    supabase_webhook_configured: Boolean(supabaseWebhookSecret),
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return noStore({ error: "Request too large" }, 413);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return noStore({ error: "Invalid settings payload" }, 400);
  }

  const submittedKeys = Object.keys(body);
  if (submittedKeys.some((key) => SECRET_FIELDS.has(key))) {
    return noStore(
      { error: "Webhook secrets must be managed in the hosting environment, not through the CRM." },
      400
    );
  }
  if (submittedKeys.some((key) => !ALLOWED_FIELDS.has(key))) {
    return noStore({ error: "Unsupported settings field" }, 400);
  }

  const payload: Record<string, unknown> = {};
  const stringLimits: Record<string, number> = {
    company_name: 160,
    vat_number: 32,
    tax_office: 120,
    address: 320,
    bank_iban: 64,
    notify_email: 254,
    ga_measurement_id: 64,
    ai_system_prompt: 12000,
  };

  for (const [key, maxLength] of Object.entries(stringLimits)) {
    if (!(key in body)) continue;
    const value = body[key];
    if (typeof value !== "string" || value.length > maxLength) {
      return noStore({ error: `Invalid value for ${key}` }, 400);
    }
    payload[key] = value.trim();
  }

  if ("notify_email" in payload && payload.notify_email) {
    const email = String(payload.notify_email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return noStore({ error: "Invalid notification email" }, 400);
    }
  }

  if ("pipeline_stages" in body) {
    const stages = body.pipeline_stages;
    if (
      !Array.isArray(stages) ||
      stages.length < 1 ||
      stages.length > 20 ||
      stages.some((stage: unknown) =>
        typeof stage !== "string" || !stage.trim() || stage.trim().length > 80
      )
    ) {
      return noStore({ error: "Pipeline stages must contain 1–20 names of up to 80 characters." }, 400);
    }
    const normalized = stages.map((stage: string) => stage.trim());
    if (new Set(normalized.map((stage) => stage.toLocaleLowerCase())).size !== normalized.length) {
      return noStore({ error: "Pipeline stage names must be unique." }, 400);
    }
    payload.pipeline_stages = normalized;
  }

  if (Object.keys(payload).length === 0) {
    return noStore({ error: "No supported settings were supplied." }, 400);
  }

  const { data, error } = await supabase
    .from("system_settings")
    .upsert({ id: "default", ...payload, updated_at: new Date().toISOString() })
    .select(SAFE_COLUMNS)
    .single();

  if (error) return noStore({ error: "Unable to save settings" }, 500);
  return noStore(data);
}
