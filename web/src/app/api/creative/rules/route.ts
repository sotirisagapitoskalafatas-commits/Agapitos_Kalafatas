import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/agents/db";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { listRules } from "@/lib/creative/server";



export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  try {
    const rules = await listRules(supabase);
    return NextResponse.json({ rules });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Rule list failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}