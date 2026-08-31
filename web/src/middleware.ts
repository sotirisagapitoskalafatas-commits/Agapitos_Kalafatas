import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminCredentials } from "./lib/admin-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    // Fail closed: if no admin credentials are configured (production), block all access.
    const creds = getAdminCredentials();
    if (!creds) {
      return new NextResponse("Admin access is not configured", { status: 503 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Dashboard"',
        },
      });
    }

    const base64Credentials = authHeader.split(" ")[1];
    let credentials = "";
    try {
      credentials = atob(base64Credentials);
    } catch {
      return new NextResponse("Invalid credentials", { status: 401 });
    }
    const [username, password] = credentials.split(":");

    if (username !== creds.user || password !== creds.pass) {
      return new NextResponse("Invalid credentials", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Dashboard"',
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  // Note: only page routes are protected by HTTP Basic Auth. API routes
  // (/api/*) are protected individually via Bearer session tokens in admin-auth.
  matcher: ["/admin/:path*"],
};
