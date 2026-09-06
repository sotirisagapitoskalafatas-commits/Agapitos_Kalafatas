import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function logNotification(type: string, status: string, message: string, details: any = {}) {
  try {
    await supabase.from("notifications").insert({
      type,
      status,
      message,
      details,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to log notification:", e);
  }
}

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    if (!process.env.SUPABASE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Webhook not configured (set SUPABASE_WEBHOOK_SECRET)" },
        { status: 501 }
      );
    }
    if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized webhook request" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const record = body.record;

    if (!record) {
      return NextResponse.json({ error: "No payload record found" }, { status: 400 });
    }

    const { full_name, email, notes, status, created_at, service_type, budget } = record;

    const leadName = full_name || `${record.first_name || ""} ${record.last_name || ""}`.trim() || "Unknown";
    const leadEmail = email || record.contact_email || "N/A";

    // 1. Slack Notification
    let slackStatus = "skipped";
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        const res = await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🚀 *New CRM Lead Captured!*`,
            attachments: [
              {
                color: "#00E699",
                fields: [
                  { title: "Name", value: leadName, short: true },
                  { title: "Email", value: leadEmail, short: true },
                  { title: "Service", value: service_type || record.service_category || "N/A", short: true },
                  { title: "Budget", value: budget || "N/A", short: true },
                  { title: "Status", value: status || record.status || "NEW", short: true },
                  { title: "Date", value: new Date(created_at).toLocaleString("el-GR"), short: true },
                  { title: "Notes", value: notes || record.comments || "No notes", short: false },
                ],
              },
            ],
          }),
        });
        slackStatus = res.ok ? "sent" : "failed";
      } catch {
        slackStatus = "failed";
      }
    }

    await logNotification("slack", slackStatus, `Slack alert for ${leadName} (${leadEmail})`, {
      leadName, leadEmail, service: service_type || record.service_category,
    });

    // 2. Email Notification
    let emailStatus = "skipped";
    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL_TO) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Agapitos Innovation Hub <onboarding@resend.dev>",
            to: [process.env.NOTIFY_EMAIL_TO],
            subject: `⚡ New Lead: ${leadName}`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;padding:20px;border:1px solid #eee;border-radius:8px;">
                <h2 style="color:#00E699;margin-top:0;">🚀 New CRM Lead</h2>
                <p><strong>Name:</strong> ${leadName}</p>
                <p><strong>Email:</strong> <a href="mailto:${leadEmail}">${leadEmail}</a></p>
                <p><strong>Service:</strong> ${service_type || record.service_category || "N/A"}</p>
                <p><strong>Budget:</strong> ${budget || "N/A"}</p>
                <p><strong>Status:</strong> ${status || record.status}</p>
                <p><strong>Time:</strong> ${new Date(created_at).toLocaleString("el-GR")}</p>
                <hr style="border:0;border-top:1px solid #eee;margin:20px 0;" />
                <p><strong>Notes:</strong></p>
                <blockquote style="background:#f9f9f9;padding:12px;border-left:4px solid #00E699;margin:0;">
                  ${notes || record.comments || "No message provided."}
                </blockquote>
              </div>
            `,
          }),
        });
        emailStatus = res.ok ? "sent" : "failed";
      } catch {
        emailStatus = "failed";
      }
    }

    await logNotification("email", emailStatus, `Email alert for ${leadName} (${leadEmail})`, {
      leadName, leadEmail, service: service_type || record.service_category,
    });

    return NextResponse.json({
      success: true,
      message: "Notifications dispatched",
      slack: slackStatus,
      email: emailStatus,
    });
  } catch (error: any) {
    console.error("Webhook notification failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
