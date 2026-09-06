import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";

// Server-only client. Uses the service-role key because system_settings is
// RLS-locked to service_role; every handler below is gated behind requireAuth,
// so the key is never reachable without a valid admin session token.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();
  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .eq("id", "default")
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? { id: "default" });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = await req.json();

  const { data, error } = await supabase
    .from("system_settings")
    .upsert({ id: "default", ...body, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
