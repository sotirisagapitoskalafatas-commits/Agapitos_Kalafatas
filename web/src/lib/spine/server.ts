import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ackHtml, ackSubject, canAckLead } from "./ack";
import type { ConsentPayload } from "./consent";
import { RENEWAL_WINDOWS, ownerEmailCandidates } from "./renewal";

type AnySupabase = SupabaseClient<any>;

export async function recordConsentRow(
  supabase: AnySupabase,
  payload: ConsentPayload
): Promise<boolean> {
  try {
    const { error } = await supabase.from("consent_log").insert(payload);
    if (error) {
      console.error("consent_log insert skipped:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("consent_log unavailable:", e);
    return false;
  }
}

export async function setLeadAttribution(
  supabase: AnySupabase,
  leadId: string,
  fields: Record<string, unknown>
): Promise<boolean> {
  try {
    const { error } = await supabase.from("leads").update(fields).eq("id", leadId);
    if (error) {
      console.error("lead attribution skipped (columns may not be migrated):", error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function ackAlreadyLogged(supabase: AnySupabase, leadId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("communications")
      .select("id")
      .eq("lead_id", leadId)
      .eq("comm_type", "email")
      .ilike("subject", "[auto-ack]%")
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function sendLeadAck(
  supabase: AnySupabase,
  lead: { id: string; email?: string | null; full_name?: string | null; ack_sent_at?: string | null },
  locale = "el"
): Promise<{ ok: boolean; reason: string }> {
  if (!canAckLead(lead)) return { ok: false, reason: "ineligible" };
  const recipient = lead.email;
  if (!recipient) return { ok: false, reason: "ineligible" };
  if (await ackAlreadyLogged(supabase, lead.id)) return { ok: false, reason: "already-acked" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "resend-not-configured" };

  const subject = ackSubject(locale);
  const html = ackHtml(locale, lead.full_name || "");

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Agapitos Kalafatas <onboarding@resend.dev>",
      to: [recipient],
      subject,
      html,
    });
    if (error) return { ok: false, reason: `resend-error:${error.message}` };

    await supabase.from("communications").insert({
      lead_id: lead.id,
      comm_type: "email",
      direction: "outbound",
      subject: `[auto-ack] ${subject}`,
      body: html,
      contact_email: recipient,
    });

    if (lead.id) {
      try {
        await supabase
          .from("leads")
          .update({ ack_sent_at: new Date().toISOString() })
          .eq("id", lead.id);
      } catch {
        /* ack_sent_at column may not be migrated yet — communications row is the durable record */
      }
    }
    return { ok: true, reason: "sent" };
  } catch (e: any) {
    return { ok: false, reason: `send-error:${e?.message ?? String(e)}` };
  }
}

export async function runRenewalScan(
  supabase: AnySupabase,
  windows: number[] = [...RENEWAL_WINDOWS]
): Promise<{ inserted: number; migrated: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("run_renewal_scan", { active_days: windows });
  if (error) {
    const msg = error.message || "";
    const notMigrated =
      /function .* does not exist|PGRST202|run_renewal_scan/i.test(msg);
    return { inserted: 0, migrated: !notMigrated, error: msg };
  }
  return { inserted: Number(data ?? 0), migrated: true };
}

export async function runRenewalMaterialize(
  supabase: AnySupabase,
  actionWindows: number[] = [14, 7, 3, 1]
): Promise<{ materialized: number; migrated: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("run_renewal_materialize", {
    action_windows: actionWindows,
  });
  if (error) {
    const msg = error.message || "";
    const notMigrated =
      /function .* does not exist|PGRST202|run_renewal_materialize/i.test(msg);
    return { materialized: 0, migrated: !notMigrated, error: msg };
  }
  return { materialized: Number(data ?? 0), migrated: true };
}

/**
 * Optional owner reminder email. Fires only for already-materialized reminders
 * with window <= 7 days whose owner_email_sent_at is still null, so repeated
 * runs (manual + pg_cron) can never double-email. Recipient is NOTIFY_EMAIL_TO
 * env, falling back to system_settings.notify_email; skipped if not configured.
 * An email failure never touches the CRM task that already exists.
 */
export async function sendRenewalOwnerEmails(
  supabase: AnySupabase,
  now: Date = new Date()
): Promise<{ sent: number; skipped: string[] }> {
  const skipped: string[] = [];
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: 0, skipped: ["resend-not-configured"] };

  let recipient = process.env.NOTIFY_EMAIL_TO;
  if (!recipient) {
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("notify_email")
        .eq("id", "default")
        .maybeSingle();
      recipient = data?.notify_email || undefined;
    } catch {
      recipient = undefined;
    }
  }
  if (!recipient) return { sent: 0, skipped: ["owner-email-not-configured"] };

  const { data: reminders, error } = await supabase
    .from("renewal_reminders")
    .select("id, lead_id, renewal_date, window_days, task_id, owner_email_sent_at, leads(full_name, email)")
    .not("task_id", "is", null)
    .is("owner_email_sent_at", null)
    .lte("window_days", 7);

  if (error) return { sent: 0, skipped: [`query:${error.message}`] };
  if (!reminders?.length) return { sent: 0, skipped: [] };

  const flatten = (r: any) => ({
    id: r.id,
    lead_id: r.lead_id,
    renewal_date: r.renewal_date,
    window_days: r.window_days,
    task_id: r.task_id,
    owner_email_sent_at: r.owner_email_sent_at,
    full_name: (r.leads as any)?.full_name ?? null,
  });

  const stillDue = ownerEmailCandidates(reminders.map(flatten), now);

  const resend = new Resend(apiKey);
  let sent = 0;
  for (const r of stillDue) {
    const name = r.name ?? r.leadId;
    try {
      const subject = `Ανανέωση συμβολαίου — ${name} (${r.windowDays} ημέρες)`;
      const html = renewalOwnerReminderHtml(name, r.renewalDate, r.windowDays);
      const { error: sendError, data: sendData } = await resend.emails.send({
        from: "Agapitos Kalafatas <onboarding@resend.dev>",
        to: [recipient],
        subject,
        html,
      });
      if (sendError) {
        skipped.push(`resend-error:${r.id}:${sendError.message}`);
        continue;
      }
      await supabase
        .from("renewal_reminders")
        .update({ owner_email_sent_at: now.toISOString() })
        .eq("id", r.id);
      await supabase.from("communications").insert({
        lead_id: r.leadId,
        comm_type: "email",
        direction: "outbound",
        subject: `[renewal-owner] ${subject}`,
        body: html,
        contact_email: recipient,
      });
      const resendId = Array.isArray(sendData) ? (sendData as any)[0]?.id : (sendData as any)?.id;
      await supabase.from("notifications").insert({
        type: "renewal",
        status: "owner-email-sent",
        message: `Owner email sent for ${name}`,
        details: { renewal_reminder_id: r.id, window_days: r.windowDays, resend_id: resendId ?? null },
      });
      sent++;
    } catch (e: any) {
      skipped.push(`send-error:${r.id}:${e?.message ?? String(e)}`);
    }
  }

  return { sent, skipped };
}

function renewalOwnerReminderHtml(name: string, renewalDate: string, windowDays: number): string {
  const safe = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `
    <div style="font-family:sans-serif;max-width:600px;padding:20px;border:1px solid #eee;border-radius:8px;">
      <h2 style="color:#f59e0b;margin-top:0;">⚡ Ανανέωση συμβολαίου — δράσε τώρα</h2>
      <p><strong>Πελάτης:</strong> ${safe(name)}</p>
      <p><strong>Ημερομηνία ανανέωσης:</strong> ${safe(renewalDate)}</p>
      <p><strong>Υπενθύμιση:</strong> ${windowDays} ημέρες πριν</p>
      <hr style="border:0;border-top:1px solid #eee;margin:20px 0;" />
      <p style="color:#666;">Από το σύστημα ανανεώσεων Atlas. Άνοιξε το CRM για να κλείσεις την εργασία.</p>
    </div>`;
}