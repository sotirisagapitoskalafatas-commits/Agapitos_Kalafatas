import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import {
  applyRequestPatch,
  requestView,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  SERVICE_KINDS,
  type RequestChangeAction,
  type RequestPatch,
  type RequestStatus,
  type ServiceRequestRow,
} from "@/lib/spine/customers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input as any, { ...init, cache: "no-store" }),
    },
  }
);

export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function toNullableString(v: unknown): string | null {
  if (typeof v !== "string") return v == null ? null : null;
  const t = v.trim();
  return t === "" ? null : t;
}

async function logEvents(requestId: string, events: { action: RequestChangeAction; field?: string; fromValue?: unknown; toValue?: unknown }[]) {
  for (const ev of events) {
    await supabase.from("activity_log").insert({
      entity_type: "service_request",
      entity_id: requestId,
      action: ev.action,
      details: {
        field: ev.field ?? null,
        fromValue: ev.fromValue ?? null,
        toValue: ev.toValue ?? null,
      },
    });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const leadId = req.nextUrl.searchParams.get("lead_id");
  let query = supabase.from("service_requests").select("*");
  if (leadId) query = query.eq("lead_id", leadId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: (data ?? []).map(requestView) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown> & RequestPatch;
  const leadId = typeof body.lead_id === "string" ? body.lead_id.trim() : "";
  const service = body.service;
  if (!leadId) return badRequest("Missing lead_id");
  if (!SERVICE_KINDS.includes(service as (typeof SERVICE_KINDS)[number])) {
    return badRequest(`Invalid service — must be one of ${SERVICE_KINDS.join(", ")}`);
  }
  const status = (body.status ?? "new") as RequestStatus;
  if (!REQUEST_STATUSES.includes(status)) return badRequest(`Invalid status — must be one of ${REQUEST_STATUSES.join(", ")}`);
  const priority = (body.priority ?? "normal") as (typeof REQUEST_PRIORITIES)[number];
  if (!REQUEST_PRIORITIES.includes(priority)) return badRequest(`Invalid priority — must be one of ${REQUEST_PRIORITIES.join(", ")}`);

  const { data: lead } = await supabase.from("leads").select("id").eq("id", leadId).maybeSingle();
  if (!lead) return badRequest("Lead not found");

  const insert: Record<string, unknown> = {
    lead_id: leadId,
    service,
    status,
    priority,
    service_type: toNullableString(body.service_type),
    reason: toNullableString(body.reason),
    description: toNullableString(body.description),
    owner: toNullableString(body.owner),
    source: toNullableString(body.source),
    campaign: toNullableString(body.campaign),
    next_action: toNullableString(body.next_action),
    closed_reason: toNullableString(body.closed_reason),
    lost_reason: toNullableString(body.lost_reason),
  };

  const { data, error } = await supabase
    .from("service_requests")
    .insert(insert)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logEvents(data.id, [
    {
      action: "created",
      field: "status",
      fromValue: null,
      toValue: data.status,
    },
  ]);

  return NextResponse.json({ request: requestView(data) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown> & RequestPatch;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return badRequest("Missing id");

  const { data: existing, error: fetchError } = await supabase
    .from("service_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!existing) return badRequest("Request not found");

  const patch: RequestPatch = {};
  for (const key of [
    "service",
    "service_type",
    "reason",
    "description",
    "status",
    "priority",
    "owner",
    "source",
    "campaign",
    "next_action",
    "closed_reason",
    "lost_reason",
  ]) {
    if (body[key] !== undefined) (patch as Record<string, unknown>)[key] = body[key];
  }

  if (patch.service !== undefined && !SERVICE_KINDS.includes(patch.service as (typeof SERVICE_KINDS)[number])) {
    return badRequest(`Invalid service — must be one of ${SERVICE_KINDS.join(", ")}`);
  }
  if (patch.status !== undefined && !REQUEST_STATUSES.includes(patch.status as RequestStatus)) {
    return badRequest(`Invalid status — must be one of ${REQUEST_STATUSES.join(", ")}`);
  }
  if (patch.priority !== undefined && !REQUEST_PRIORITIES.includes(patch.priority as (typeof REQUEST_PRIORITIES)[number])) {
    return badRequest(`Invalid priority — must be one of ${REQUEST_PRIORITIES.join(", ")}`);
  }

  const { row, events } = applyRequestPatch(existing as ServiceRequestRow, patch);

  const { data, error } = await supabase
    .from("service_requests")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logEvents(id, events);

  return NextResponse.json({ request: requestView(data) });
}