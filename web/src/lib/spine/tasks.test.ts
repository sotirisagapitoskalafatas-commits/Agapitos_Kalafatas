import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTaskEvent, isTaskRow, taskFromEvent, TASK_TYPES } from "./tasks.ts";

test("isTaskRow identifies task/reminder events", () => {
  assert.equal(isTaskRow({ event_type: "task" }), true);
  assert.equal(isTaskRow({ event_type: "reminder" }), true);
  assert.equal(isTaskRow({ event_type: "meeting" }), false);
  assert.equal(isTaskRow({ event_type: null }), false);
});

test("buildTaskEvent defaults to an open task", () => {
  const e = buildTaskEvent({ title: "  Call Maria  " });
  assert.equal(e.title, "Call Maria");
  assert.equal(e.event_type, "task");
  assert.equal(e.completed, false);
  assert.equal(e.all_day, false);
  assert.equal(e.lead_id, null);
  assert.equal(e.deal_id, null);
  assert.equal(typeof e.start_time, "string");
  assert.equal(e.start_time, e.end_time);
});

test("buildTaskEvent honors reminder type and due date", () => {
  const e = buildTaskEvent({
    title: "Renewal nudge",
    eventType: "reminder",
    dueAt: "2026-12-01T08:00:00.000Z",
    leadId: "lead-1",
    location: "phone",
  });
  assert.equal(e.event_type, "reminder");
  assert.equal(e.start_time, "2026-12-01T08:00:00.000Z");
  assert.equal(e.lead_id, "lead-1");
  assert.equal(e.location, "phone");
});

test("taskFromEvent maps event row to task shape", () => {
  const t = taskFromEvent({
    id: "evt-1",
    title: "Follow up",
    description: "send quote",
    start_time: "2026-09-10T10:00:00Z",
    completed: true,
    event_type: "task",
    lead_id: "lead-9",
    deal_id: "deal-9",
    location: "zoom",
    created_at: "2026-09-01T00:00:00Z",
  });
  assert.equal(t.id, "evt-1");
  assert.equal(t.dueAt, "2026-09-10T10:00:00Z");
  assert.equal(t.completed, true);
  assert.equal(t.eventType, "task");
  assert.equal(t.leadId, "lead-9");
});

test("TASK_TYPES matches the allowed DB values", () => {
  assert.deepEqual([...TASK_TYPES], ["task", "reminder"]);
});