import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { setConnectionStatus, deleteConnection } from "@/lib/social/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const id = context.params.id;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.status !== "string") {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  try {
    const connection = await setConnectionStatus(supabase, id, body.status);
    return NextResponse.json({ connection });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Status update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  try {
    await deleteConnection(supabase, context.params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}