import { NextRequest, NextResponse } from "next/server";
import {
  generateSessionToken,
  isAuthConfigured,
  isSameOriginRequest,
  sessionCookieOptions,
  verifyAdminCredentials,
  SESSION_TTL_SECONDS,
} from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Reject cross-origin login attempts before doing any credential work.
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  // This is an instance-level throttle. Use a shared store/WAF for a
  // distributed guarantee across Vercel serverless instances.
  const limited = rateLimit(request, "login", 5, 60_000);
  if (limited) return limited;

  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "Authentication is not configured. Check the Production admin credentials and AUTH_SECRET settings." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 8192) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    const body = await request.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password || username.length > 128 || password.length > 1024) {
      return NextResponse.json(
        { error: "Enter a valid username and password" },
        { status: 400 }
      );
    }

    if (!(await verifyAdminCredentials(username, password))) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const token = await generateSessionToken(username);
    const response = NextResponse.json(
      {
        success: true,
        expiresInSeconds: SESSION_TTL_SECONDS,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
    response.cookies.set("atlas_session", token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Unable to sign in right now" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { configured: isAuthConfigured() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
