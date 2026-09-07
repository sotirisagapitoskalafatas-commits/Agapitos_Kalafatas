import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ackHtml, ackSubject, canAckLead } from "./ack";
import type { ConsentPayload } from "./consent";
import { RENEWAL_WINDOWS } from "./renewal";

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