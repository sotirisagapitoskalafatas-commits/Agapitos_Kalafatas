import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Manual lead creation (the "Νέο Lead" button in the CRM). Public form
// submissions still come through /api/contact, /api/site-leads, /api/chat.
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = await req.json();

  // Whitelist writable columns so an unexpected key can't error the insert.
  const record: Record<string, unknown> = {};
  for (const key of LEAD_COLUMNS) {
    if (body[key] !== undefined) record[key] = body[key];
  }

  // Required by schema: first_name (NOT NULL), phone (NOT NULL).
  if (!record.first_name || String(record.first_name).trim() === "") {
    return NextResponse.json({ error: "first_name required" }, { status: 400 });
  }
  if (!record.phone || String(record.phone).trim() === "") {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }
  if (!record.status) record.status = "new_lead";
  if (record.gdpr_consent === undefined) record.gdpr_consent = false;

  const { data, error } = await supabase
    .from("leads")
    .insert([record])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Column whitelist shared by POST and PATCH so both paths write to the exact
// same set of lead fields (and nothing else).
const LEAD_COLUMNS = [
  "first_name", "last_name", "email", "phone", "property_type", "region",
  "service_category", "comments", "status", "gdpr_consent", "notes",
  "company", "address", "id_number", "provider", "program", "source",
  "lead_type", "partner", "partner_notes", "assigned_agent", "renewal_date",
  "supplies",
];

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Whitelist writable columns on PATCH too, symmetric with POST, so a stray
  // body key can't silently write to the table.
  const record: Record<string, unknown> = {};
  for (const key of LEAD_COLUMNS) {
    if (updates[key] !== undefined) record[key] = updates[key];
  }
  if (Object.keys(record).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  // DATE columns reject "" — normalize an empty/cleared date to null.
  if (record.renewal_date === "") record.renewal_date = null;

  const { data, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
