import { NextRequest } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!GEMINI_API_KEY) {
      return new Response("GEMINI_API_KEY not configured", { status: 500 });
    }

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an elite frontend web designer. Generate a complete, production-ready, beautifully styled landing page based on this description: "${prompt}"

Rules:
- Return ONLY valid HTML code. No markdown blocks, no conversational text.
- Include Tailwind CSS via CDN in the head: <script src="https://cdn.tailwindcss.com"></script>
- Include modern design: clean typography, whitespace, hero section, features, CTA, footer
- Use Inter font from Google Fonts
- Make it responsive and visually stunning
- Use a clean white or light theme with accent colors
- Include smooth CSS animations
- The HTML should be a complete, standalone document`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 8192,
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
      return new Response("Failed to generate website", { status: 500 });
    }

    const data = await response.json();
    let html = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean up markdown code blocks if present
    html = html.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim();

    return new Response(html, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Generate site error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
