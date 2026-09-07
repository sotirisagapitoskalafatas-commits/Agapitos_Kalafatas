import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { testConnection } from "@/lib/social/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  try {
    const result = await testConnection(supabase, context.params.id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Probe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}