import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { listRules } from "@/lib/creative/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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