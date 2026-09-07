import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { listMedia } from "@/lib/creative/server";
import type { MediaFilter } from "@/lib/creative/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const sp = req.nextUrl.searchParams;
  const filter: MediaFilter = {
    type: sp.get("type") || undefined,
    status: sp.get("status") || undefined,
    campaignId: sp.get("campaignId") || undefined,
    q: sp.get("q") || undefined,
    limit: Number(sp.get("limit")) || undefined,
  };

  try {
    const assets = await listMedia(supabase, filter);
    return NextResponse.json({ assets });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Media list failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}