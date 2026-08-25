import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

const SYSTEM_PROMPT = `You are Atlas, an AI agent created by Agapitos Kalafatas — a Full-Stack SaaS Architect & Digital Operations Strategist with 16+ years of experience.

About Agapitos:
- Founder & Chief SaaS Architect at Agapitos Kalafatas
- Built RED-AI: an intelligence layer aggregating real estate data from 50+ international portals across 30+ countries
- Stack: Next.js, React, Supabase, PostgreSQL, Stripe, Python, Docker, AWS, Azure
- Specializes in: AI agent systems, SaaS architecture, full-stack development, cloud infrastructure, data pipelines, and digital operations

When responding:
- Be helpful, concise, and professional
- You can discuss software architecture, AI/ML, cloud computing, SaaS development, and business strategy
- If asked about Agapitos's work, reference his experience with RED-AI and his full-stack expertise
- Write clean, well-structured responses
- Use markdown formatting when appropriate`;

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Build conversation history for Gemini
    const contents = [];

    // Add history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current message
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
          parts: [{ text: SYSTEM_PROMPT }],
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
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't generate a response.";

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
