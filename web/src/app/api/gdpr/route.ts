import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "client_documents";

// Recursively collect every file under a lead's storage folder so an erase can
// remove them all, even the typed sub-folders (leadId/docType/filename).
async function listAllFiles(prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw new Error(error.message);

  for (const entry of data || []) {
    const isFolder = !!(entry as { id?: string | null }).id === false;
    const name = `${prefix}/${entry.name}`;
    if (isFolder) {
      out.push(...(await listAllFiles(name)));
    } else {
      out.push(name);
    }
  }
  return out;
}

async function sign(path: string, expiresIn: number = 3600 * 24 * 7): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

// GET /api/gdpr?lead_id=… → full export bundle with 7-day signed document URLs.
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("lead_id");
  if (!leadId) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

  const [leadRes, dealsRes, commsRes, eventsRes, invoicesRes, logRes] = await Promise.all([
    supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
    supabase.from("deals").select("*").eq("lead_id", leadId),
    supabase.from("communications").select("*").eq("lead_id", leadId),
    supabase.from("calendar_events").select("*").eq("lead_id", leadId),
    supabase.from("invoices").select("*").eq("lead_id", leadId),
    supabase.from("activity_log").select("*").eq("entity_id", leadId).order("created_at", { ascending: false }),
  ]);
  if (leadRes.error) return NextResponse.json({ error: leadRes.error.message }, { status: 500 });
  if (!leadRes.data) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const errors = [dealsRes, commsRes, eventsRes, invoicesRes, logRes]
    .map((r) => r.error)
    .filter((e) => e);
  if (errors.length) return NextResponse.json({ error: errors[0]!.message }, { status: 500 });

  const files = await listAllFiles(leadId);
  const documents = await Promise.all(
    files.map(async (path) => ({ path, url: await sign(path) }))
  );

  return NextResponse.json(
    {
      exported_at: new Date().toISOString(),
      lead: leadRes.data,
      deals: dealsRes.data || [],
      communications: commsRes.data || [],
      calendar_events: eventsRes.data || [],
      invoices: invoicesRes.data || [],
      activity_log: logRes.data || [],
      documents,
    },
    { status: 200 }
  );
}

// DELETE /api/gdpr { lead_id, confirm:true } → erase the person's data.
// Order matters and is error-checked BEFORE deleting the lead so a partial
// failure aborts before the record of record is gone.
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { lead_id: leadId, confirm } = await req.json();
  if (!leadId || confirm !== true) {
    return NextResponse.json(
      { error: "lead_id and confirm:true required" },
      { status: 400 }
    );
  }

  try {
    // 1. Remove all stored documents for the lead.
    const files = await listAllFiles(leadId);
    if (files.length > 0) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove(files);
      if (storageError) throw new Error(`storage: ${storageError.message}`);
    }

    // 2. Delete the PII-bearing child rows (communications, calendar events).
    const { error: commsError } = await supabase.from("communications").delete().eq("lead_id", leadId);
    if (commsError) throw new Error(`communications: ${commsError.message}`);

    const { error: eventsError } = await supabase.from("calendar_events").delete().eq("lead_id", leadId);
    if (eventsError) throw new Error(`calendar_events: ${eventsError.message}`);

    // 3. Delete the lead (deals/invoices keep their rows; lead_id SET NULLs —
    //    verified in prod as SET NULL, not CASCADE).
    const { error: leadError } = await supabase.from("leads").delete().eq("id", leadId);
    if (leadError) throw new Error(`lead: ${leadError.message}`);

    // 4. Tombstone in activity_log for auditability.
    await supabase.from("activity_log").insert({
      entity_type: "lead",
      entity_id: leadId,
      action: "gdpr_erase",
      details: { erased_at: new Date().toISOString() },
    });

    return NextResponse.json({ ok: true, erased: leadId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erase failed" },
      { status: 500 }
    );
  }
}