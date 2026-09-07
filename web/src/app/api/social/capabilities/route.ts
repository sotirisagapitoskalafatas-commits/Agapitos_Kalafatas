import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { CAPABILITY_MATRIX, platformCapabilities } from "@/lib/social/capabilities";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const url = new URL(req.url);
  const platform = url.searchParams.get("platform");
  if (platform && platformCapabilities(platform).length === 0 && !(platform in CAPABILITY_MATRIX)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }
  const data =
    platform && platform in CAPABILITY_MATRIX
      ? { [platform]: platformCapabilities(platform) }
      : CAPABILITY_MATRIX;
  return NextResponse.json({ platforms: data });
}