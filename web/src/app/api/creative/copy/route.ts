import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/agents/db";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { generateCopyRun } from "@/lib/creative/server";
import { PLATFORMS, LANGUAGES } from "@/lib/creative/types";



export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = await req.json().catch(() => null);
  if (!body || typeof body.assetId !== "string" || !body.assetId) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 });
  }

  const platforms = (Array.isArray(body.platforms) ? body.platforms : [])
    .filter((p: unknown): p is string => typeof p === "string")
    .filter((p: string) => (PLATFORMS as readonly string[]).includes(p));
  const languages = (Array.isArray(body.languages) ? body.languages : [])
    .filter((l: unknown): l is string => typeof l === "string")
    .filter((l: string) => (LANGUAGES as readonly string[]).includes(l));

  if (!platforms.length || !languages.length) {
    return NextResponse.json(
      { error: "At least one valid platform and language are required" },
      { status: 400 }
    );
  }

  try {
    const result = await generateCopyRun(supabase, {
      user: auth.user,
      assetId: body.assetId,
      platforms,
      languages,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Copy generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}