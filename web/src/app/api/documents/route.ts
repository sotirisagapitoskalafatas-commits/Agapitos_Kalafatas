import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "client_documents";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("lead_id");
  if (!leadId) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

  const { data, error } = await supabase.storage.from(BUCKET).list(leadId, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const documents = await Promise.all(
    (data || []).map(async (file) => {
      const { data: urlData } = await supabase.storage.from(BUCKET).getPublicUrl(`${leadId}/${file.name}`);
      return { name: file.name, url: urlData.publicUrl, path: `${leadId}/${file.name}` };
    })
  );

  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const leadId = formData.get("lead_id") as string | null;
  if (!file || !leadId) return NextResponse.json({ error: "file and lead_id required" }, { status: 400 });

  const filePath = `${leadId}/${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return NextResponse.json({ document: { name: file.name, url: urlData.publicUrl, path: filePath } });
}

export async function DELETE(req: Request) {
  const { path } = await req.json();
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
