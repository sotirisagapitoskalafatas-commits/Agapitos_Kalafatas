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
  // Rate limit: 5 submissions / minute / IP — this route uses the service role,
  // so it must never become an unthrottled public insert path.
  const limited = rateLimit(request, "leads", 5, 60_000);
  if (limited) return limited;

  try {
    const { clientName, clientContact, projectDetails } = await request.json();

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

    const { error: dbError } = await supabase.from("leads").insert([
      {
        client_name: clientName,
        client_contact: clientContact,
        project_details: projectDetails || "",
        first_name: clientName,
        phone: clientContact,
        comments: projectDetails || "",
        status: "new_lead",
      },
    ]);

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

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
            subject: `🚨 New Lead: ${escapeHtml(clientName)} via Website Chat`,
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
