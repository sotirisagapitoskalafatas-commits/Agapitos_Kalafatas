import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

const SYSTEM_PROMPT = `You are Atlas AI, the premium virtual assistant for Agapitos Kalafatas.
You offer high-end consulting and services across three main pillars:

1. Web, SaaS & Software Development:
   - We build premium E-shops (starting from €1400) focused on strategy and conversions.
   - Custom Web Development and Website Management.
   - Advanced Full-Stack Software Development, AI Agents, and Neural Systems.
   - Differentiator: Personal contact, no faceless support tickets, custom designs made to sell.

2. Energy Services (Hlektrismos.gr):
   - Cheap Power Programs, Natural Gas, Solar Panels (Φωτοβολταϊκά).
   - EV Charging (Ηλεκτροκίνηση) and Energy Storage/Savings.

3. Insurance Services:
   - Life Insurance, Health Insurance, and Car Insurance.

Tone: Professional, helpful, concise, and persuasive.
Goal: Politely collect the visitor's: First & Last Name, Phone Number, Service Category, and Project Details. Once gathered, call 'saveLeadToCRM' immediately.

IMPORTANT - Lead Detection:
When a user provides ALL THREE of the following details during conversation, include a JSON block at the very end of your response (after your normal message) in this EXACT format:
<!--LEAD_DATA:{"clientName":"[their name]","clientContact":"[their email or phone]","projectDetails":"[summary of what they need]"}-->

Only include this block when you have genuinely collected:
1. Their full name
2. Their email address or phone number
3. A description of their project or service needs

Do NOT include this block if any of the three pieces are missing. Ask naturally for missing information.`;

export async function POST(request: NextRequest) {
  try {
    const { message, history, locale } = await request.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const langMap: Record<string, string> = { en: "English", el: "Greek", fr: "French" };
    const langInstruction = locale && langMap[locale]
      ? `\n\nIMPORTANT: The user's language is set to ${langMap[locale]}. You MUST respond entirely in ${langMap[locale]}. All your responses, explanations, and text must be written in ${langMap[locale]}.`
      : "";

    const contents = [];

    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT + langInstruction }],
        },
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from Gemini" },
        { status: 500 }
      );
    }

    const data = await response.json();
    let text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't generate a response.";

    // Extract lead data if present
    let lead = null;
    const leadMatch = text.match(/<!--LEAD_DATA:(\{.*?\})-->/);
    if (leadMatch) {
      try {
        lead = JSON.parse(leadMatch[1]);
        // Remove the lead data block from the visible response
        text = text.replace(/<!--LEAD_DATA:.*?-->/, "").trim();
      } catch (e) {
        // Invalid JSON in lead block, ignore
      }
    }

    return NextResponse.json({ response: text, lead });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
