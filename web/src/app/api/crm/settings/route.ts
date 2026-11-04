import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/agents/db";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";



export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .limit(1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
