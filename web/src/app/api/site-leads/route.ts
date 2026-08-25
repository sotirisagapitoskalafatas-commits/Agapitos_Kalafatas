import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Create site_leads table if it doesn't exist
async function ensureTable(supabase: any) {
  await supabase.rpc("exec_sql", {
    query: `
      create table if not exists site_leads (
        id uuid default gen_random_uuid() primary key,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null,
        site_id text not null,
        site_name text default '',
        client_name text not null,
        client_email text not null,
        client_phone text default '',
        message text default '',
        status text default 'New'
      );
      alter table site_leads enable row level security;
      drop policy if exists "Allow public insert on site_leads" on site_leads;
      create policy "Allow public insert on site_leads" on site_leads for insert with check (true);
      drop policy if exists "Allow read on site_leads" on site_leads;
      create policy "Allow read on site_leads" on site_leads for select using (true);
    `,
  }).catch(() => {});
}

export async function POST(request: NextRequest) {
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

    // Try to insert (table might not exist yet)
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
      // Table might not exist, try to create it
      if (dbError.message?.includes("does not exist") || dbError.code === "42P01") {
        await ensureTable(supabase);
        // Retry insert
        const { error: retryError } = await supabase.from("site_leads").insert([
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
        if (retryError) {
          console.error("Retry insert error:", retryError);
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
      } else {
        console.error("Supabase error:", dbError);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }
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
                  <p><strong>Site:</strong> ${siteName || siteId}</p>
                  <p><strong>Name:</strong> ${name}</p>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Phone:</strong> ${phone || "N/A"}</p>
                  <p><strong>Message:</strong> ${message || "N/A"}</p>
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
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const adminUser = process.env.ADMIN_USERNAME || "agapitos";
    const adminPass = process.env.ADMIN_PASSWORD || "atlas2026";

    try {
      const decoded = atob(token);
      const [user, pass] = decoded.split(":");
      if (user !== adminUser || pass !== adminPass) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

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
