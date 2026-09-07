import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/html";
import { buildConsentRecord } from "@/lib/spine/consent";
import { isValidIdempotencyKey, newIdempotencyKey } from "@/lib/spine/idempotency";
import { recordConsentRow, setLeadAttribution } from "@/lib/spine/server";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64) || null;
  return req.headers.get("x-real-ip");
}

function clean(v: unknown, max = 512): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, max);
}

export async function POST(request: NextRequest) {
  // Rate limit: 5 submissions / minute / IP — this route uses the service role,
  // so it must never become an unthrottled public insert path.
  const limited = rateLimit(request, "leads", 5, 60_000);
  if (limited) return limited;

  try {
    const payload = await request.json();
    const { clientName, clientContact } = payload;

    if (!clientName || !clientContact) {
      return NextResponse.json(
        { error: "Client name and contact are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    const projectDetails = typeof payload.projectDetails === "string" ? payload.projectDetails : "";
    const email = clean(payload.email, 320);
    const gdprConsent = payload.gdpr_consent === true;
    const idempotencyKey = isValidIdempotencyKey(payload.idempotency_key)
      ? payload.idempotency_key
      : newIdempotencyKey();
    const consentVersion = clean(payload.consent_version, 32) || "v1";
    const consentSource = clean(payload.consent_source, 256) || "website_chat";
    const locale = clean(payload.locale, 8) || "el";
    const attribution = {
      utm_source: clean(payload.utm_source),
      utm_medium: clean(payload.utm_medium),
      utm_campaign: clean(payload.utm_campaign),
      utm_term: clean(payload.utm_term),
      utm_content: clean(payload.utm_content),
      referrer: clean(payload.referrer, 1024),
      landing_path: clean(payload.landing_path),
    };

    // Idempotent resubmissions: return the existing lead instead of inserting a duplicate.
    try {
      const { data: existing } = await supabase
        .from("leads")
        .select("id, client_name, created_at")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ success: true, lead: existing, duplicate: true });
      }
    } catch {
      // idempotency_key column not migrated yet — fall through to insert.
    }

    const insertable: Record<string, unknown> = {
      client_name: clientName,
      client_contact: clientContact,
      project_details: projectDetails,
      first_name: clientName,
      phone: clientContact,
      email: email ?? undefined,
      comments: projectDetails || "",
      status: "new_lead",
      gdpr_consent: gdprConsent,
    };

    const { data: lead, error: dbError } = await supabase
      .from("leads")
      .insert([insertable])
      .select()
      .single();

    if (dbError) {
      if (/idempotency_key/i.test(dbError.message || "")) {
        const { data: dup } = await supabase
          .from("leads")
          .select("id, client_name, created_at")
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();
        if (dup) return NextResponse.json({ success: true, lead: dup, duplicate: true });
      }
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Foundation spine: attribution + consent columns + audit trail (best-effort).
    await setLeadAttribution(supabase, lead.id, {
      idempotency_key: idempotencyKey,
      consent_version: consentVersion,
      consent_granted_at: gdprConsent ? new Date().toISOString() : null,
      consent_source: consentSource,
      ...attribution,
    });

    await recordConsentRow(
      supabase,
      buildConsentRecord({
        entityId: lead.id,
        email,
        granted: gdprConsent,
        consentVersion,
        source: consentSource,
        ip: clientIp(request),
        userAgent: request.headers.get("user-agent"),
        details: { attribution },
      })
    );

    // Send email via Resend (if configured)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Atlas AI <onboarding@resend.dev>",
            to: "kalafatasagapitos@gmail.com",
            subject: `🚨 New Lead: ${clientName} via Website Chat`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #3b82f6;">New Client Inquiry</h2>
                <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
                  <p><strong>Name:</strong> ${escapeHtml(clientName)}</p>
                  <p><strong>Contact:</strong> ${escapeHtml(clientContact)}</p>
                  <p><strong>Project:</strong> ${escapeHtml(projectDetails || "Not specified")}</p>
                </div>
                <p style="color: #64748b; font-size: 12px;">Sent by Atlas AI • Agapitos Kalafatas Website</p>
              </div>
            `,
          }),
        });
      } catch (emailError) {
        console.error("Email error:", emailError);
      }
    }

    return NextResponse.json({ success: true, message: "Lead saved successfully" });
  } catch (error) {
    console.error("Leads API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return unauthorizedResponse();

  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 }
      );
    }

    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Leads GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}