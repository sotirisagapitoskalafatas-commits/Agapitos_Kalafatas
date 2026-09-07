// Public chat — the single path to Atlas for site visitors (/chat page and the
// AtlasAgenticWidget FAB).
//
// Consolidated onto the lib/agents orchestrator (multi-agent RAG + tier
// cascade + audit). Differences from the admin /api/agent:
//   - Unauthenticated, rate-limited 12/min/IP.
//   - publicMode=true: routing is restricted to the service-advisory agents
//     (webdev/energy/insurance/general) and ONLY knowledge-base read tools are
//     exposed — the CRM/PII read tools (search_leads, search_deals, …) never
//     reach a visitor.
//   - Lead capture is a dedicated public tool: it requires explicit GDPR
//     consent (gdprConsent === true) and HTML-escapes everything before it
//     reaches an email body or subject.
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { orchestrate } from "@/lib/agents/orchestrator";
import { rateLimit } from "@/lib/rate-limit";
import { getMarketingSystemPrompt } from "@/lib/marketingInjector";
import type { AgentContext, Tool } from "@/lib/agents/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL_TO || "kalafatasagapitos@gmail.com";

const langMap: Record<string, string> = {
  en: "English",
  el: "Greek",
  fr: "French",
};

// Escape every user/model-controlled value before it enters an email body or
// subject line (HTML/email injection vector).
function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

const cap = (value: unknown, max: number) => String(value ?? "").slice(0, max);

export async function POST(request: NextRequest) {
  // Rate limit: 12 messages / minute / IP (protects the LLM quota).
  const limited = rateLimit(request, "chat", 12, 60_000);
  if (limited) return limited;

  let lead: {
    clientName: string;
    clientContact: string;
    projectDetails: string;
  } | null = null;

  const savePublicLead: Tool = {
    name: "save_public_lead",
    description:
      "Save a site visitor's contact details as a CRM lead. Call this ONLY after the user has explicitly given their first name, last name, and a phone/email AND has clearly asked to be contacted (or otherwise agreed to it). Never store or send anything without their contact info and consent.",
    category: "write",
    argsSchema: {
      type: "object",
      properties: {
        firstName: { type: "string", description: "Lead first name" },
        lastName: { type: "string", description: "Lead last name" },
        contactInfo: { type: "string", description: "Phone or email, exactly as given" },
        serviceCategory: { type: "string", description: "The service they are interested in" },
        projectDetails: { type: "string", description: "Brief summary of what they need" },
        gdprConsent: { type: "boolean", description: "Did the user agree to being contacted?" },
      },
      required: ["firstName", "contactInfo", "gdprConsent"],
    },
    run: async (_ctx, args) => {
      if (args.gdprConsent !== true) {
        return { success: false, error: "The visitor has not consented to being contacted." };
      }
      const firstName = cap(args.firstName, 120);
      const contactInfo = cap(args.contactInfo, 120);
      if (!firstName.trim() || !contactInfo.trim()) {
        return { success: false, error: "Missing contact details." };
      }

      const record = {
        first_name: firstName,
        last_name: cap(args.lastName, 120),
        phone: contactInfo,
        service_category: cap(args.serviceCategory || "other", 80),
        comments: `[Atlas Chat]: ${cap(args.projectDetails, 1000)}`,
        status: "new_lead",
        gdpr_consent: true,
        source: "atlas-chat",
      };

      const { error } = await supabase.from("leads").insert([record]);
      if (error) {
        return { success: false, error: error.message };
      }

      lead = {
        clientName: `${firstName} ${cap(args.lastName, 120)}`.trim(),
        clientContact: contactInfo,
        projectDetails: cap(args.projectDetails, 1000),
      };

      // Notification email is non-critical — best-effort only.
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Atlas AI <leads@agapitoskalafatas.com>",
          to: NOTIFY_EMAIL,
          subject: `🤖 New Atlas Chat lead: ${escapeHtml(firstName)} ${escapeHtml(record.last_name)} (${escapeHtml(record.service_category)})`,
          html: `<div style="font-family:sans-serif;padding:20px;background:#f8f9fa;border-radius:12px;">
              <h2 style="color:#2563eb;">New Lead via Atlas AI Chat</h2>
              <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(record.last_name)}</p>
              <p><strong>Contact:</strong> ${escapeHtml(contactInfo)}</p>
              <p><strong>Service:</strong> ${escapeHtml(record.service_category)}</p>
              <p><strong>Details:</strong> ${escapeHtml(args.projectDetails)}</p>
            </div>`,
        });
      } catch {
        // ignore — CRM save already succeeded
      }

      return { success: true, message: "Lead saved." };
    },
  };

  try {
    const { message, history, locale, page } = await request.json();

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    const text = message.trim().slice(0, 4000);

    const langInstruction =
      locale && langMap[locale]
        ? `\n\nIMPORTANT: The user's language is set to ${langMap[locale]}. Respond entirely in ${langMap[locale]}.`
        : "";

    const marketingContext =
      page === "marketing"
        ? `\n\n${getMarketingSystemPrompt()}\n\nYou are currently in Marketing mode. Apply the marketing frameworks above to all responses.`
        : "";

    // Bounded prior turns only. Client-supplied roles are never trusted for a
    // system role, and history is capped so it can't bloat the context window.
    const safeHistory = Array.isArray(history)
      ? history
          .filter((m: any) => m && (m.role === "user" || m.role === "assistant"))
          .slice(-12)
          .map((m: any) => ({
            role: m.role as "user" | "assistant",
            content: String(m.content || "").slice(0, 3000),
          }))
      : [];

    const context: AgentContext = {
      userId: "anon",
      organizationId: "public",
      role: "member",
      requestId: randomUUID(),
    };

    const result = await orchestrate(context, text, undefined, {
      publicMode: true,
      extraTools: [savePublicLead],
      systemExtra: langInstruction + marketingContext,
      history: safeHistory,
    });

    // Preserve the free-tier quota UX instead of the generic error text.
    if (/\(429\)|RESOURCE_EXHAUSTED/i.test(result.finalAnswer) && result.steps.length === 0) {
      const quotaMsg =
        langMap[locale] === "Greek"
          ? "Το ημερήσιο όριο αιτημάτων του AI έχει εξαντληθεί (δωρεάν plan, 20/ημέρα). Δοκιμάστε ξανά σε λίγα λεπτά."
          : langMap[locale] === "French"
          ? "La limite quotidienne de requêtes IA est atteinte (gratuit, 20/jour). Réessayez dans quelques minutes."
          : "The AI daily request limit has been reached (free tier, 20/day). Please try again in a few minutes.";
      return NextResponse.json({ response: quotaMsg, lead: null });
    }

    return NextResponse.json({
      response: result.finalAnswer,
      lead,
      meta: {
        provider: result.provider,
        model: result.model,
        agent: result.steps[0]?.agent || null,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}