import { NextRequest, NextResponse } from "next/server";
import {
  isSameOriginRequest,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const response = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } }
  );
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
