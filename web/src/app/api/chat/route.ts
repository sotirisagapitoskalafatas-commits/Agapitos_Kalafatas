import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { retrieveKnowledge } from "@/lib/rag";
import { getMarketingSystemPrompt } from "@/lib/marketingInjector";
import { Resend } from "resend";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Tool Definitions ──────────────────────────────────────────

async function handleToolCall(
  toolName: string,
  args: Record<string, any>
): Promise<string> {
  switch (toolName) {
    case "webDevSubAgent": {
      const knowledge = await retrieveKnowledge(args.query, "web_dev");
      return JSON.stringify({
        agent: "Agent 1 (Web & Software)",
        context: knowledge,
      });
    }
    case "energySubAgent": {
      const knowledge = await retrieveKnowledge(args.query, "energy");
      return JSON.stringify({
        agent: "Agent 2 (Energy Services)",
        context: knowledge,
      });
    }
    case "insuranceSubAgent": {
      const knowledge = await retrieveKnowledge(args.query, "insurance");
      return JSON.stringify({
        agent: "Agent 3 (Insurance Services)",
        context: knowledge,
      });
    }
    case "saveLeadToCRM": {
      try {
        const { error: dbError } = await supabase.from("leads").insert([
          {
            first_name: args.firstName,
            last_name: args.lastName,
            phone: args.contactInfo,
            service_category: args.serviceCategory,
            comments: `[Agentic RAG Lead]: ${args.projectDetails}`,
            status: "new_lead",
            gdpr_consent: true,
          },
        ]);

        if (dbError) {
          return JSON.stringify({ success: false, error: dbError.message });
        }

        // Send email notification
        try {
          await resend.emails.send({
            from: "Atlas AI <leads@agapitoskalafatas.com>",
            to: "kalafatasagapitos@gmail.com",
            subject: `🤖 Agentic RAG Lead: ${args.firstName} ${args.lastName} (${args.serviceCategory})`,
            html: `<div style="font-family:sans-serif;padding:20px;background:#f8f9fa;border-radius:12px;">
              <h2 style="color:#2563eb;">New Lead via Atlas AI Agentic RAG</h2>
              <p><strong>Name:</strong> ${args.firstName} ${args.lastName}</p>
              <p><strong>Contact:</strong> ${args.contactInfo}</p>
              <p><strong>Service:</strong> ${args.serviceCategory}</p>
              <p><strong>Details:</strong> ${args.projectDetails}</p>
            </div>`,
          });
        } catch {
          // Email fail is non-critical
        }

        return JSON.stringify({
          success: true,
          message: "Lead saved to CRM and email sent.",
        });
      } catch {
        return JSON.stringify({ success: false, error: "CRM insert failed" });
      }
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ── Gemini Tool Schema ────────────────────────────────────────

const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "webDevSubAgent",
        description:
          "Agent 1: Consults knowledge base for E-shops (starting €1400), Website Management, Custom Web Development, Software/SaaS Development, AI Agents. Use when user asks about web development, pricing, software, SaaS, or AI systems.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "The specific web/software topic to look up",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "energySubAgent",
        description:
          "Agent 2: Consults knowledge base for energy services - electricity rates, natural gas, photovoltaics, EV charging, energy storage. Use when user asks about Ρεύμα, Αέριο, Φωτοβολταϊκά, EV charging, or energy.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "The energy service question",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "insuranceSubAgent",
        description:
          "Agent 3: Consults knowledge base for Life Insurance, Health Insurance, Car Insurance, and property insurance. Use when user asks about Ασφάλεια, insurance policies, health, life, or car coverage.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "The insurance product question",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "saveLeadToCRM",
        description:
          "Saves lead details directly to Supabase CRM and sends email notification. Use when user has provided: first name, last name, contact info (phone/email), and service category.",
        parameters: {
          type: "OBJECT",
          properties: {
            firstName: { type: "STRING", description: "Lead first name" },
            lastName: { type: "STRING", description: "Lead last name" },
            contactInfo: {
              type: "STRING",
              description: "Phone or email",
            },
            serviceCategory: {
              type: "STRING",
              description: "The service they are interested in",
            },
            projectDetails: {
              type: "STRING",
              description: "Summary of what they need",
            },
          },
          required: [
            "firstName",
            "lastName",
            "contactInfo",
            "serviceCategory",
            "projectDetails",
          ],
        },
      },
    ],
  },
];

const SYSTEM_PROMPT = `You are Atlas AI, an Agentic RAG-powered virtual assistant for Agapitos Kalafatas.

ARCHITECTURE (Chain-of-Thought Planning):
1. Short/Long Term Memory: Analyze the full chat history for context.
2. Planning (CoT): Before answering, determine which Sub-Agent to consult:
   - Agent 1 (Web & Software): E-shops starting at €1400, Custom Web Design, Website Management, Software/SaaS Development, AI Agents.
   - Agent 2 (Energy): Electricity/Ρεύμα, Natural Gas, Photovoltaics, EV Charging, Energy Storage.
   - Agent 3 (Insurance): Life Insurance, Health Insurance, Car Insurance.
3. Retrieval (RAG): Invoke the matching sub-agent tool to fetch verified facts from the knowledge base before answering pricing or policy questions.
4. Lead Collection: Collect First Name, Last Name, Phone/Email, Service, and Details. Once gathered, call 'saveLeadToCRM'.

RULES:
- Always call the appropriate Sub-Agent tool when discussing pricing, policies, or services.
- Be helpful, concise, and professional.
- Respond in the same language the user writes in.
- Do NOT make up pricing or policy details — only use retrieved knowledge.
- When you have collected lead details, save them immediately.`;

// ── Main API Handler ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { message, history, locale, page } = await request.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const langMap: Record<string, string> = {
      en: "English",
      el: "Greek",
      fr: "French",
    };
    const langInstruction =
      locale && langMap[locale]
        ? `\n\nIMPORTANT: The user's language is set to ${langMap[locale]}. Respond entirely in ${langMap[locale]}.`
        : "";

    // Inject marketing context when on /marketing page
    const marketingContext = page === "marketing"
      ? `\n\n${getMarketingSystemPrompt()}\n\nYou are currently in Marketing mode. Apply the marketing frameworks above to all responses.`
      : "";

    // Build conversation history
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    // ── Agentic Loop (max 3 tool-call rounds) ──────────────
    let finalText = "";
    let lead = null;

    for (let round = 0; round < 3; round++) {
      const response = await fetch(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT + langInstruction + marketingContext }],
            },
            tools: GEMINI_TOOLS,
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE",
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        console.error("Gemini API error:", await response.json());
        return NextResponse.json(
          { error: "Failed to get response from Gemini" },
          { status: 500 }
        );
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];

      if (!candidate?.content?.parts?.length) {
        return NextResponse.json({
          response: "I could not generate a response. Please try again.",
          lead: null,
        });
      }

      const parts = candidate.content.parts;

      // Check for function calls
      const functionCalls = parts.filter((p: any) => p.functionCall);
      const textParts = parts.filter((p: any) => p.text);

      if (functionCalls.length > 0) {
        // Add model response with function calls to history
        contents.push({ role: "model", parts });

        // Execute each tool call
        for (const fc of functionCalls) {
          const toolResult = await handleToolCall(
            fc.functionCall.name,
            fc.functionCall.args
          );

          // Check if this was a lead save
          if (fc.functionCall.name === "saveLeadToCRM") {
            try {
              const parsed = JSON.parse(toolResult);
              if (parsed.success) {
                lead = {
                  clientName: `${fc.functionCall.args.firstName} ${fc.functionCall.args.lastName}`,
                  clientContact: fc.functionCall.args.contactInfo,
                  projectDetails: fc.functionCall.args.projectDetails,
                };
              }
            } catch {}
          }

          // Add tool response to conversation
          contents.push({
            role: "function",
            parts: [
              {
                functionResponse: {
                  name: fc.functionCall.name,
                  response: JSON.parse(toolResult),
                },
              },
            ],
          });
        }

        // Continue loop to let Gemini formulate final response
        continue;
      }

      // No function calls — this is the final text response
      finalText = textParts.map((p: any) => p.text).join("\n");
      break;
    }

    if (!finalText) {
      finalText =
        "I apologize, I encountered an issue processing your request. Please try again.";
    }

    return NextResponse.json({ response: finalText, lead });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
