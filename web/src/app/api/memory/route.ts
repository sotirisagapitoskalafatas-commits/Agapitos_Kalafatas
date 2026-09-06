import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";

const VAULT_DIR = path.join(
  process.cwd(),
  "components",
  "ai-memory-vault"
);

const ALLOWED_FILES = [
  "MEMORY.md",
  "DAILY-NOTE.md",
  "CLAUDE.md",
  "README.md",
  "Gemini.md",
];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file") || "MEMORY.md";

  // Guard against path traversal
  const safeFileName = path.basename(file);

  // Only allow known files
  if (!ALLOWED_FILES.includes(safeFileName)) {
    return NextResponse.json(
      { success: false, error: "File not allowed" },
      { status: 403 }
    );
  }

  const vaultPath = path.join(VAULT_DIR, safeFileName);

  try {
    const fileContent = fs.readFileSync(vaultPath, "utf8");
    return NextResponse.json({
      success: true,
      fileName: safeFileName,
      content: fileContent,
      lastModified: fs.statSync(vaultPath).mtime.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "File not found" },
      { status: 404 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return unauthorizedResponse();

  const body = await request.json();
  const { file, content } = body;

  if (!file || !content) {
    return NextResponse.json(
      { success: false, error: "file and content required" },
      { status: 400 }
    );
  }

  const safeFileName = path.basename(file);
  if (!ALLOWED_FILES.includes(safeFileName)) {
    return NextResponse.json(
      { success: false, error: "File not allowed" },
      { status: 403 }
    );
  }

  const vaultPath = path.join(VAULT_DIR, safeFileName);

  try {
    fs.writeFileSync(vaultPath, content, "utf8");
    return NextResponse.json({
      success: true,
      fileName: safeFileName,
      message: "File saved successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to write file" },
      { status: 500 }
    );
  }
}
