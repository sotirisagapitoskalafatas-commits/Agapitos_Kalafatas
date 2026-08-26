import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    if (
      process.env.SUPABASE_WEBHOOK_SECRET &&
      secret !== process.env.SUPABASE_WEBHOOK_SECRET
    ) {
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

    const slackPromise = process.env.SLACK_WEBHOOK_URL
      ? fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🚀 *New CRM Lead Captured!*`,
            attachments: [
              {
                color: "#00E699",
                fields: [
                  { title: "Name", value: full_name || "N/A", short: true },
                  { title: "Email", value: email || "N/A", short: true },
                  { title: "Service", value: service_type || "N/A", short: true },
                  { title: "Budget", value: budget || "N/A", short: true },
                  { title: "Status", value: status || "NEW", short: true },
                  {
                    title: "Date",
                    value: new Date(created_at).toLocaleString("el-GR"),
                    short: true,
                  },
                  {
                    title: "Notes",
                    value: notes || "No notes",
                    short: false,
                  },
                ],
              },
            ],
          }),
        })
      : Promise.resolve();

    const emailPromise =
      process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL_TO
        ? fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Agapitos Innovation Hub <onboarding@resend.dev>",
              to: [process.env.NOTIFY_EMAIL_TO],
              subject: `⚡ New Lead: ${full_name}`,
              html: `
                <div style="font-family:sans-serif;max-width:600px;padding:20px;border:1px solid #eee;border-radius:8px;">
                  <h2 style="color:#00E699;margin-top:0;">🚀 New CRM Lead</h2>
                  <p><strong>Name:</strong> ${full_name}</p>
                  <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                  <p><strong>Service:</strong> ${service_type || "N/A"}</p>
                  <p><strong>Budget:</strong> ${budget || "N/A"}</p>
                  <p><strong>Status:</strong> ${status}</p>
                  <p><strong>Time:</strong> ${new Date(created_at).toLocaleString("el-GR")}</p>
                  <hr style="border:0;border-top:1px solid #eee;margin:20px 0;" />
                  <p><strong>Notes:</strong></p>
                  <blockquote style="background:#f9f9f9;padding:12px;border-left:4px solid #00E699;margin:0;">
                    ${notes || "No message provided."}
                  </blockquote>
                </div>
              `,
            }),
          })
        : Promise.resolve();

    await Promise.all([slackPromise, emailPromise]);

    return NextResponse.json({ success: true, message: "Notifications dispatched" });
  } catch (error: any) {
    console.error("Webhook notification failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
