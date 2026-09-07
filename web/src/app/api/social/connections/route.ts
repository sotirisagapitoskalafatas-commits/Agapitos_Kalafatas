import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { listConnections, saveConnection, testConnection, setConnectionStatus, deleteConnection } from "@/lib/social/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  try {
    const connections = await listConnections(supabase);
    return NextResponse.json({ connections });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Connection list failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = await req.json().catch(() => null);
  if (!body || typeof body.platform !== "string" || typeof body.accountName !== "string") {
    return NextResponse.json(
      { error: "platform and accountName are required" },
      { status: 400 }
    );
  }

  try {
    const connection = await saveConnection(supabase, {
      platform: body.platform,
      accountName: body.accountName,
      accountId: typeof body.accountId === "string" ? body.accountId : undefined,
      provider: typeof body.provider === "string" ? body.provider : undefined,
      scopes: Array.isArray(body.scopes) ? body.scopes : undefined,
      capabilitiesDeclared: Array.isArray(body.capabilitiesDeclared) ? body.capabilitiesDeclared : undefined,
      token: typeof body.token === "string" && body.token ? body.token : undefined,
      createdBy: auth.user,
    });
    return NextResponse.json({ connection });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Connection save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}