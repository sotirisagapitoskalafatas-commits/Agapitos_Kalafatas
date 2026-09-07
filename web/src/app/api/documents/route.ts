import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "client_documents";

// Known typed slots. Files are stored at `${leadId}/${docType}/${filename}`.
// Anything uploaded without a doc_type stays at `${leadId}/${filename}` (legacy
// flat layout) and is reported under the "other" group.
const KNOWN_TYPES = [
  "taftotita",           // Ταυτότητα
  "e9",                  // Ε9
  "misthotirio",         // Μισθωτήριο
  "symvolaio",           // Συμβόλαιο
  "logariasmos_current", // Τρέχων Λογαριασμός
  "logariasmos_prev",    // Προηγούμενος Λογαριασμός
  "prosfores",           // Προσφορές
  "other",               // Άλλα έγγραφα
];

type Doc = { name: string; url: string; path: string; type: string };

async function sign(path: string): Promise<string> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? "";
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("lead_id");
  if (!leadId) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

  const { data: rootEntries, error } = await supabase.storage.from(BUCKET).list(leadId, {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const flat: Doc[] = [];
  const groups: Record<string, Doc[]> = {};
  const pushGroup = (type: string, doc: Doc) => {
    (groups[type] ||= []).push(doc);
  };

  for (const entry of rootEntries || []) {
    // Supabase returns folders as entries with a null `id`; real files carry an id.
    const isFile = !!(entry as { id?: string | null }).id;

    if (isFile) {
      // Legacy flat file directly under the lead folder → "other".
      const path = `${leadId}/${entry.name}`;
      const doc: Doc = { name: entry.name, url: await sign(path), path, type: "other" };
      flat.push(doc);
      pushGroup("other", doc);
    } else {
      // A "folder" whose name is the document type.
      const type = entry.name;
      const { data: sub } = await supabase.storage.from(BUCKET).list(`${leadId}/${type}`, {
        limit: 200,
        sortBy: { column: "created_at", order: "desc" },
      });
      for (const f of sub || []) {
        if (!(f as { id?: string | null }).id) continue;
        const path = `${leadId}/${type}/${f.name}`;
        const doc: Doc = { name: f.name, url: await sign(path), path, type };
        flat.push(doc);
        pushGroup(type, doc);
      }
    }
  }

  return NextResponse.json({ documents: flat, groups });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const leadId = formData.get("lead_id") as string | null;
  const rawType = (formData.get("doc_type") as string | null)?.trim() || "";
  if (!file || !leadId) return NextResponse.json({ error: "file and lead_id required" }, { status: 400 });

  // Only allow a known slot as a path segment; unknown/empty → legacy flat path.
  const docType = KNOWN_TYPES.includes(rawType) ? rawType : "";
  const filePath = docType ? `${leadId}/${docType}/${file.name}` : `${leadId}/${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    document: { name: file.name, url: await sign(filePath), path: filePath, type: docType || "other" },
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { path } = await req.json();
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}