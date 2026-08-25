import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const adminUser = process.env.ADMIN_USERNAME || "agapitos";
    const adminPass = process.env.ADMIN_PASSWORD || "atlas2026";

    if (username === adminUser && password === adminPass) {
      // Return base64 encoded token
      const token = btoa(`${username}:${password}`);
      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
