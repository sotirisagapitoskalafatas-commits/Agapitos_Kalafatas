import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { generateImageRun } from "@/lib/creative/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = await req.json().catch(() =>null);
  if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const count =
    typeof body.count === "number" && Number.isInteger(body.count)
      ? Math.max(1, Math.min(4, body.count))
      : 1;

  const referenceImage =
    body.referenceImage && typeof body.referenceImage.dataBase64 === "string"
      ? {
          dataBase64: body.referenceImage.dataBase64,
          mimeType:
            typeof body.referenceImage.mimeType === "string"
              ? body.referenceImage.mimeType
              : "image/png",
        }
      : undefined;

  try {
    const result = await generateImageRun(supabase, {
      user: auth.user,
      prompt: body.prompt.slice(0, 4000),
      count,
      language: typeof body.language === "string" ? body.language : undefined,
      objective: typeof body.objective === "string" ? body.objective : undefined,
      tone: typeof body.tone === "string" ? body.tone : undefined,
      service: typeof body.service === "string" ? body.service : undefined,
      audience: typeof body.audience === "string" ? body.audience : undefined,
      aspectRatio: typeof body.aspectRatio === "string" ? body.aspectRatio : undefined,
      campaignId: typeof body.campaignId === "string" ? body.campaignId : undefined,
      campaignName: typeof body.campaignName === "string" ? body.campaignName : undefined,
      referenceImage,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}