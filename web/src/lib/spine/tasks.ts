export const TASK_TYPES = ["task", "reminder"] as const;

export type TaskRow = {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  all_day?: boolean | null;
  event_type?: string | null;
  lead_id?: string | null;
  deal_id?: string | null;
  location?: string | null;
  completed?: boolean | null;
  created_at?: string | null;
};

export function isTaskRow(r: { event_type?: string | null }): boolean {
  return !!r.event_type && (TASK_TYPES as readonly string[]).includes(r.event_type);
}

export function buildTaskEvent(input: {
  title: string;
  description?: string;
  dueAt?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  location?: string;
  eventType?: "task" | "reminder";
  completed?: boolean;
}): TaskRow {
  const dt = input.dueAt || new Date().toISOString();
  return {
    title: input.title.trim(),
    description: input.description ?? "",
    event_type: input.eventType ?? "task",
    start_time: dt,
    end_time: dt,
    all_day: false,
    lead_id: input.leadId ?? null,
    deal_id: input.dealId ?? null,
    location: input.location ?? "",
    completed: input.completed ?? false,
  };
}

export function taskFromEvent(r: TaskRow): Record<string, unknown> {
  return {
    id: r.id ?? null,
    title: r.title ?? "",
    description: r.description ?? "",
    dueAt: r.start_time ?? null,
    completed: r.completed ?? false,
    eventType: r.event_type ?? null,
    leadId: r.lead_id ?? null,
    dealId: r.deal_id ?? null,
    location: r.location ?? null,
    createdAt: r.created_at ?? null,
  };
}