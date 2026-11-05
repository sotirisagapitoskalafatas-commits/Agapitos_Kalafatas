import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/agents/db";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const SAFE_COLUMNS =
  "id,company_name,vat_number,tax_office,address,bank_iban,notify_email,ga_measurement_id,ai_system_prompt,pipeline_stages";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { data, error } = await supabase
    .from("system_settings")
    .select(`${SAFE_COLUMNS},slack_webhook_url,supabase_webhook_secret`)
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Unable to load CRM settings" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!data) {
    return NextResponse.json(
      { data: null, slack_webhook_configured: false, supabase_webhook_configured: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const {
    slack_webhook_url: slackWebhookUrl,
    supabase_webhook_secret: supabaseWebhookSecret,
    ...safeData
  } = data;

  return NextResponse.json(
    {
      data: safeData,
      slack_webhook_configured: Boolean(slackWebhookUrl),
      supabase_webhook_configured: Boolean(supabaseWebhookSecret),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
