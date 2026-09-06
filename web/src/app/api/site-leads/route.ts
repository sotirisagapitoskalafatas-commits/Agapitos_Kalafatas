import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/html";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  // Rate limit: 5 submissions / minute / IP.
  const limited = rateLimit(request, "site-leads", 5, 60_000);
  if (limited) return limited;

  try {
    const { siteId, siteName, name, email, phone, message } = await request.json();

    if (!siteId || !name || !email) {
      return NextResponse.json(
        { error: "siteId, name, and email are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 503 }
      );
    }

    // The site_leads table is provisioned via web/config/schema.sql (site_leads
    // migration). If the insert fails because the table is missing, that is an
    // operator setup error — surface it rather than trying to CREATE TABLE at
    // request time (the old exec_sql path never worked and recreated open RLS).
    const { error: dbError } = await supabase.from("site_leads").insert([
      {
        site_id: siteId,
        site_name: siteName || "",
        client_name: name,
        client_email: email,
        client_phone: phone || "",
        message: message || "",
        status: "New",
      },
    ]);

    if (dbError) {
      console.error("Supabase error:", dbError);
      if (dbError.code === "42P01") {
        return NextResponse.json(
          { error: "site_leads table is missing — apply web/config/2026-09-06-site_leads.sql" },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Send email notification
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
            from: "Atlas Builder <onboarding@resend.dev>",
            to: "kalafatasagapitos@gmail.com",
            subject: `New Lead from ${siteName || "Generated Site"}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h2 style="color:#3b82f6;">New Website Lead</h2>
                <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">
                  <p><strong>Site:</strong> ${escapeHtml(siteName || siteId)}</p>
                  <p><strong>Name:</strong> ${escapeHtml(name)}</p>
                  <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                  <p><strong>Phone:</strong> ${escapeHtml(phone || "N/A")}</p>
                  <p><strong>Message:</strong> ${escapeHtml(message || "N/A")}</p>
                </div>
                <p style="color:#64748b;font-size:12px;">Atlas Builder CRM • Agapitos Kalafatas</p>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.error("Email error:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Site leads error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Gate behind the shared HMAC session-token auth. No hardcoded fallback:
    // requireAuth fails closed when AUTH_SECRET is unset or the token is bad.
    const auth = await requireAuth(request);
    if (!auth.ok) return unauthorizedResponse();

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }

    const { data: leads, error } = await supabase
      .from("site_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
