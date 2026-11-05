import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/agents/db";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";

const BUCKET = "client_documents";
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const KNOWN_TYPES = [
  "taftotita",
  "e9",
  "misthotirio",
  "symvolaio",
  "logariasmos_current",
  "logariasmos_prev",
  "prosfores",
  "other",
] as const;

type DocType = (typeof KNOWN_TYPES)[number];
type Doc = { name: string; url: string; path: string; type: DocType };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isLeadId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function isSafeFileName(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 180 &&
    value !== "." &&
    value !== ".." &&
    !/[\\/\u0000-\u001f\u007f]/.test(value)
  );
}

function storageFileName(originalName: string): string {
  const baseName = originalName.normalize("NFKC").split(/[\\/]/).pop() || "document";
  const safeBase = baseName
    .replace(/[^\p{L}\p{N}._-]+/gu, "_")
    .replace(/^\.+/, "")
    .slice(0, 110) || "document";
  return `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBase}`;
}

function isKnownDocType(value: string): value is DocType {
  return (KNOWN_TYPES as readonly string[]).includes(value);
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function leadExists(leadId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function sign(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) return "";
  return data?.signedUrl ?? "";
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const leadId = new URL(req.url).searchParams.get("lead_id") || "";
  if (!isLeadId(leadId)) return json({ error: "A valid lead_id is required" }, 400);

  try {
    if (!(await leadExists(leadId))) return json({ error: "Lead not found" }, 404);

    const { data: rootEntries, error } = await supabase.storage.from(BUCKET).list(leadId, {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) return json({ error: "Unable to list lead documents" }, 500);

    const flat: Doc[] = [];
    const groups: Record<string, Doc[]> = {};
    const pushGroup = (type: DocType, doc: Doc) => {
      (groups[type] ||= []).push(doc);
    };

    for (const entry of rootEntries || []) {
      const isFile = Boolean((entry as { id?: string | null }).id);

      if (isFile) {
        if (!isSafeFileName(entry.name)) continue;
        const path = `${leadId}/${entry.name}`;
        const doc: Doc = { name: entry.name, url: await sign(path), path, type: "other" };
        flat.push(doc);
        pushGroup("other", doc);
        continue;
      }

      const type = entry.name;
      if (!isKnownDocType(type)) continue;
      const { data: sub, error: subError } = await supabase.storage.from(BUCKET).list(`${leadId}/${type}`, {
        limit: 200,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (subError) continue;

      for (const file of sub || []) {
        if (!(file as { id?: string | null }).id || !isSafeFileName(file.name)) continue;
        const path = `${leadId}/${type}/${file.name}`;
        const doc: Doc = { name: file.name, url: await sign(path), path, type };
        flat.push(doc);
        pushGroup(type, doc);
      }
    }

    return json({ documents: flat, groups });
  } catch (error) {
    console.error("Document list error:", error);
    return json({ error: "Unable to list lead documents" }, 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  try {
    const formData = await req.formData();
    const fileEntry = formData.get("file");
    const leadId = String(formData.get("lead_id") || "");
    const rawType = String(formData.get("doc_type") || "").trim();

    if (!(fileEntry instanceof File) || !isLeadId(leadId)) {
      return json({ error: "A valid file and lead_id are required" }, 400);
    }
    if (rawType && !isKnownDocType(rawType)) {
      return json({ error: "Unsupported document type" }, 400);
    }
    if (fileEntry.size <= 0 || fileEntry.size > MAX_FILE_BYTES) {
      return json({ error: "Files must be between 1 byte and 25 MB" }, 413);
    }
    if (!ALLOWED_MIME_TYPES.has(fileEntry.type)) {
      return json({ error: "Unsupported document file type" }, 415);
    }
    if (!(await leadExists(leadId))) return json({ error: "Lead not found" }, 404);

    const docType = rawType ? rawType as DocType : "";
    const filename = storageFileName(fileEntry.name);
    const filePath = docType ? `${leadId}/${docType}/${filename}` : `${leadId}/${filename}`;
    const buffer = Buffer.from(await fileEntry.arrayBuffer());

    const { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
      contentType: fileEntry.type,
      upsert: false,
    });
    if (error) return json({ error: "Unable to upload document" }, 500);

    return json({
      document: {
        name: filename,
        url: await sign(filePath),
        path: filePath,
        type: docType || "other",
      },
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return json({ error: "Unable to upload document" }, 500);
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  try {
    const body = await req.json().catch(() => null);
    const path = typeof body?.path === "string" ? body.path : "";
    const segments = path.split("/");

    if (
      (segments.length !== 2 && segments.length !== 3) ||
      !isLeadId(segments[0]) ||
      !isSafeFileName(segments[segments.length - 1]) ||
      segments.some((segment) => !segment || segment === "." || segment === "..")
    ) {
      return json({ error: "Invalid document path" }, 400);
    }

    if (segments.length === 3 && !isKnownDocType(segments[1])) {
      return json({ error: "Invalid document type" }, 400);
    }
    if (!(await leadExists(segments[0]))) return json({ error: "Lead not found" }, 404);

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) return json({ error: "Unable to delete document" }, 500);

    return json({ ok: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return json({ error: "Unable to delete document" }, 500);
  }
}
