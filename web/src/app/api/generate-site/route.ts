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

    const systemPrompt = `You are an elite frontend web designer. Generate a complete, production-ready HTML landing page.

CRITICAL RULES - YOU MUST FOLLOW ALL OF THESE:
1. Start your response with <!DOCTYPE html> and end with </html>. NOTHING else before or after.
2. Do NOT use markdown code blocks. Do NOT use backticks. Output raw HTML only.
3. Include in <head>: <script src="https://cdn.tailwindcss.com"></script> and Google Fonts Inter
4. The page MUST contain ALL of these sections in order:
   - Navigation bar (fixed, with logo text and links)
   - Hero section (large headline, subtitle, 2 CTA buttons, gradient or image background)
   - Features/Services section (3-6 cards with icons using SVG or emoji)
   - About section (text + image placeholder from picsum.photos)
   - Testimonials or Stats section
   - CTA section (call to action with button)
   - Footer (links, copyright)
5. Use Tailwind CSS classes for ALL styling. Example: <div class="bg-white rounded-2xl shadow-xl p-8">
6. Include smooth CSS animations using @keyframes in a <style> tag
7. Make it fully responsive using sm: md: lg: prefixes
8. Use a professional color scheme: white backgrounds, dark text, one accent color
9. Add hover effects on buttons and cards
10. Use placeholder images: <img src="https://picsum.photos/seed/xyz/800/600" alt="...">
11. Minimum 150 lines of HTML for a complete look
12. All text must be in English`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nUser request: ${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.9,
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
      const err = await response.text();
      console.error("Gemini error:", err);
      return new Response("Failed to generate website", { status: 500 });
    }

    const data = await response.json();
    let html = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean up markdown code blocks aggressively
    html = html.replace(/^```html\s*/gi, "").replace(/^```\s*/gm, "").replace(/```\s*$/gm, "").trim();

    // If it doesn't start with DOCTYPE, try to find the HTML
    if (!html.toLowerCase().includes("<!doctype")) {
      const htmlStart = html.indexOf("<!DOCTYPE");
      if (htmlStart === -1) {
        const htmlStart2 = html.indexOf("<html");
        if (htmlStart2 > 0) {
          html = html.substring(htmlStart2);
        }
      } else {
        html = html.substring(htmlStart);
      }
    }

    // Remove trailing non-HTML content
    const htmlEnd = html.lastIndexOf("</html>");
    if (htmlEnd > 0) {
      html = html.substring(0, htmlEnd + 6);
    }

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Generate site error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
