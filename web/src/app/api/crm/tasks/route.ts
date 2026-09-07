import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { buildTaskEvent, taskFromEvent } from "@/lib/spine/tasks";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  // Prefer the tasks view added by the foundation migration; fall back to
  // filtering calendar_events so the API works both before and after migration.
  let rows: any[] = [];
  let error: { message: string } | null = null;
  try {
    const res = await supabase
      .from("tasks")
      .select("*")
      .order("start_time", { ascending: true });
    rows = res.data ?? [];
    error = res.error;
  } catch {
    error = null;
  }
  if (error && !/relation "tasks" does not exist/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (rows.length === 0) {
    const res = await supabase
      .from("calendar_events")
      .select("*")
      .in("event_type", ["task", "reminder"])
      .order("start_time", { ascending: true });
    rows = res.data ?? [];
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
  }

  return NextResponse.json(rows.map(taskFromEvent));
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const body = (await req.json().catch(() => ({}))) as {
    title?: unknown;
    description?: unknown;
    dueAt?: unknown;
    leadId?: unknown;
    dealId?: unknown;
    location?: unknown;
    eventType?: unknown;
  };

  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const event = buildTaskEvent({
    title: body.title,
    description: typeof body.description === "string" ? body.description : "",
    dueAt: typeof body.dueAt === "string" ? body.dueAt : null,
    leadId: typeof body.leadId === "string" ? body.leadId : null,
    dealId: typeof body.dealId === "string" ? body.dealId : null,
    location: typeof body.location === "string" ? body.location : "",
    eventType: body.eventType === "reminder" ? "reminder" : "task",
    completed: false,
  });

  const { data, error } = await supabase.from("calendar_events").insert(event).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(taskFromEvent(data));
}