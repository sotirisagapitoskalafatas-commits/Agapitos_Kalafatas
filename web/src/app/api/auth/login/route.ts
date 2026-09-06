import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminCredentials,
  generateSessionToken,
  getAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    let username = "";
    let password = "";
    try {
      const body = await request.json();
      username = body?.username ?? "";
      password = body?.password ?? "";
    } catch {
      // fall through to validation
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (await verifyAdminCredentials(username, password)) {
      try {
        const token = await generateSessionToken(username);
        return NextResponse.json({ success: true, token });
      } catch {
        return NextResponse.json(
          { error: "Admin auth is not configured (set AUTH_SECRET)" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Expose whether admin auth is configured so the client can fail-closed.
  const configured = getAdminCredentials() !== null;
  return NextResponse.json({ configured });
}
