import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { listCampaigns, ensureCampaign } from "@/lib/creative/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  try {
    const campaigns = await listCampaigns(supabase);
    return NextResponse.json({ campaigns });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Campaign list failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
  }

  try {
    const id = await ensureCampaign(supabase, {
      name: body.name,
      service: typeof body.service === "string" ? body.service : undefined,
      audience: typeof body.audience === "string" ? body.audience : undefined,
      objective: typeof body.objective === "string" ? body.objective : undefined,
      tone: typeof body.tone === "string" ? body.tone : undefined,
      language: typeof body.language === "string" ? body.language : undefined,
      createdBy: auth.user,
    });
    return NextResponse.json({ id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Campaign create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}