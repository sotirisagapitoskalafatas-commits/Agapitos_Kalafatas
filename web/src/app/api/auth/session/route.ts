import { NextRequest, NextResponse } from "next/server";
import {
  isAuthConfigured,
  requireAuth,
  SESSION_TTL_SECONDS,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  return NextResponse.json(
    {
      configured: isAuthConfigured(),
      authenticated: auth.ok,
      expiresInSeconds: auth.ok ? SESSION_TTL_SECONDS : 0,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
