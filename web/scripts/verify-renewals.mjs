import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = loadEnv(fileURLToPath(new URL("../.env.local", import.meta.url)));
const BASE = process.env.BASE_URL || "http://localhost:3111";
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

const out = [];
const step = (name, ok, detail) => {
  out.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  console.log(out[out.length - 1]);
};

async function setup() {
  await supabase.from("leads").delete().in("id", [A, B]);
  const tomorrow10 = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
  const past5 = new Date(Date.now() - 5 * 864e5).toISOString().slice(0, 10);
  const { error } = await supabase.from("leads").insert([
    { id: A, client_name: "Verify A", client_contact: "0000000001", first_name: "VerifyA", phone: "0000000001", email: "verifya@test.local", status: "customer", service_category: "Ρεύμα", renewal_date: tomorrow10, full_name: "VerifyA Renewal" },
    { id: B, client_name: "Verify B", client_contact: "0000000002", first_name: "VerifyB", phone: "0000000002", email: "verifyb@test.local", status: "customer", service_category: "Ρεύμα", renewal_date: past5, full_name: "VerifyB Overdue" },
  ]);
  if (error) throw new Error(`setup insert: ${error.message}`);
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD }),
  });
  const body = await res.json();
  if (!res.ok || !body.token) throw new Error(`login failed (${res.status})`);
  return body.token;
}

async function api(token, path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function run() {
  const token = await login();

  const run1 = await api(token, "/api/crm/renewals/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ windows: [90, 60, 30, 14, 7, 3, 1], actionWindows: [14, 7, 3, 1], email: true }),
  });
  step("run #1 http 200", run1.status === 200, `status=${run1.status}`);
  const r1 = run1.body;
  step("run #1 scanned past scan", Number(r1.scanned) >= 1, `scanned=${r1.scanned}`);
  step("run #1 materialized 1", Number(r1.materialized) === 1, `materialized=${r1.materialized}`);
  step("run #1 owner emails skipped (unconfigured)", Array.isArray(r1.ownerEmailSkipped) && r1.ownerEmailSkipped.includes("owner-email-not-configured"), `sent=${r1.ownerEmailsSent} skipped=${JSON.stringify(r1.ownerEmailSkipped)}`);

  const upcoming = await api(token, "/api/crm/renewals/upcoming?days=30&overdue=1");
  const u = upcoming.body;
  step("upcoming http 200", upcoming.status === 200);
  const hitA = (u.renewals || []).find((x) => x.leadId === A);
  step("upcoming includes lead A", !!hitA, hitA ? `daysLeft=${hitA.daysLeft} window=${hitA.window} reminder=${hitA.reminderStatus} task=${hitA.taskId ? "yes" : "no"}` : "not found");
  const hitB = (u.overdue || []).find((x) => x.leadId === B);
  step("overdue includes lead B", !!hitB, hitB ? `daysOverdue=${hitB.daysOverdue}` : "not found");
  step("counts present", !!u.counts && typeof u.counts.total === "number", `total=${u.counts?.total} overdue=${u.counts?.overdue} byWindow=${JSON.stringify(u.counts?.byWindow)}`);

  const run2 = await api(token, "/api/crm/renewals/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ windows: [90, 60, 30, 14, 7, 3, 1], actionWindows: [14, 7, 3, 1], email: true }),
  });
  step("run #2 idempotent (materialized 0)", Number(run2.body.materialized) === 0, `materialized=${run2.body.materialized}`);

  const { data: tasks, error: te } = await supabase
    .from("calendar_events")
    .select("id, title, event_type, completed, start_time")
    .in("lead_id", [A, B]);
  step("task created for A only", !te && Array.isArray(tasks), `tasks=${JSON.stringify((tasks || []).map((t) => ({ type: t.event_type, start: t.start_time })))}`);

  const { data: reminders, error: re } = await supabase
    .from("renewal_reminders")
    .select("id, lead_id, window_days, status, task_id, owner_email_sent_at")
    .in("lead_id", [A, B]);
  const rems = reminders || [];
  const onlyA = !re && rems.length > 0 && rems.every((r) => r.lead_id === A);
  const taskLinked = rems.filter((r) => r.task_id);
  step("reminders ledger for A only", onlyA, `reminders=${JSON.stringify(rems.map((r) => ({ lead: r.lead_id.slice(0, 8), w: r.window_days, status: r.status, task: !!r.task_id })))}`);
  step("exactly one reminder task-linked", !re && taskLinked.length === 1, `taskLinked=${taskLinked.length}`);

  const { count: notifCount, error: ne } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .in("renewal_reminder_id", (reminders || []).map((r) => r.id));
  step("notification created for reminder", !ne && notifCount === 1, `notifications=${notifCount}`);

  return { r1, u };
}

async function cleanup() {
  const { data: reminders } = await supabase.from("renewal_reminders").select("id").in("lead_id", [A, B]);
  const ids = (reminders || []).map((r) => r.id);
  if (ids.length) {
    await supabase.from("notifications").delete().in("renewal_reminder_id", ids);
    await supabase.from("calendar_events").delete().in("renewal_reminder_id", ids);
    await supabase.from("renewal_reminders").delete().in("id", ids);
  }
  const { error } = await supabase.from("leads").delete().in("id", [A, B]);
  if (error) throw new Error(`cleanup: ${error.message}`);
}

try {
  await setup();
  await run();
} catch (e) {
  step("error", false, e.message);
} finally {
  try {
    await cleanup();
  } catch (e) {
    step("cleanup", false, e.message);
  }
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true });
  step("leads count back to baseline", count === 1, `leads=${count}`);
  console.log(out.join("\n"));
}