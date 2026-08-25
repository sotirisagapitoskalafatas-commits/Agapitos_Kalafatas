import { NextRequest } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

export async function POST(request: NextRequest) {
  try {
    const { message, history, images } = await request.json();

    if (!GEMINI_API_KEY) {
      return new Response("GEMINI_API_KEY not configured", { status: 500 });
    }

    if (!message) {
      return new Response("Message is required", { status: 400 });
    }

    const systemPrompt = `You are Atlas Builder, an expert web designer AI. You create real, production-ready websites through conversation.

CAPABILITIES:
- You generate complete, standalone HTML files with Tailwind CSS
- Users can describe what they want, upload images, and iterate
- You refine the website based on feedback until it's perfect
- You can add contact forms, CRM lead capture, image galleries, etc.

RULES FOR GENERATING HTML:
When asked to generate or create a website, output ONLY a JSON object with this format:
{"action":"generate","html":"<完整的HTML代码>","siteName":"网站名称","description":"简短描述"}

When asked to modify or update the existing website, output ONLY a JSON object:
{"action":"modify","html":"<完整的修改后HTML代码>","siteName":"网站名称","description":"修改描述"}

When just chatting (not generating/modifying), respond normally as Atlas Builder.

HTML GENERATION RULES:
1. Start with <!DOCTYPE html>, end with </html>
2. Include: <script src="https://cdn.tailwindcss.com"></script> in <head>
3. Include Google Fonts (Inter) in <head>
4. Sections: Nav, Hero, Features, About, Gallery (if images provided), Contact Form with CRM, Footer
5. Contact form must submit to: fetch('/api/site-leads', {method:'POST', body: JSON.stringify({siteId:'SITE_ID_HERE', name, email, phone, message})})
6. Replace SITE_ID_HERE with a unique ID you generate
7. All styling via Tailwind utility classes
8. Fully responsive with sm: md: lg: prefixes
9. Professional color scheme, smooth animations
10. Include <style> tag for custom animations
11. Use placeholder images from picsum.photos or unsplash if no images uploaded
12. If user provides images, use them: <img src="USER_IMAGE_URL" alt="...">
13. Minimum 200 lines for a complete look
14. Add inline CSS for glassmorphism effects on cards and sections
15. Include a professional footer with "Powered by Agapitos Kalafatas" link

CONTACT FORM CRM:
Every generated site MUST include a contact form that:
- Has fields: Name, Email, Phone (optional), Message
- On submit, sends data to /api/site-leads with the site's unique ID
- Shows a success message after submission
- This gives every generated site its own mini CRM

IMAGE HANDLING:
When user provides images (as URLs or base64), incorporate them into the design:
- Hero background if appropriate
- Gallery/portfolio section
- About section
- Product/service images

IMPORTANT: Only output JSON when generating/modifying. For normal conversation, just chat naturally.`;

    const contents = [];

    // Add conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Build the user message with optional images
    const parts: any[] = [{ text: message }];

    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img.startsWith("data:")) {
          // Base64 image
          const [header, data] = img.split(",");
          const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
          parts.push({
            inlineData: {
              mimeType,
              data,
            },
          });
        } else {
          // URL image - add as text reference
          parts.push({ text: `[User uploaded image: ${img}]` });
        }
      }
    }

    contents.push({ role: "user", parts });

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
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
      return new Response("Failed to generate", { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse as JSON action
    try {
      const jsonMatch = text.match(/\{[\s\S]*"action"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Clean HTML if present
        if (parsed.html) {
          parsed.html = parsed.html.replace(/```html\s*/gi, "").replace(/```\s*/gm, "").trim();
        }
        return new Response(JSON.stringify(parsed), {
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      // Not JSON, return as regular message
    }

    return new Response(JSON.stringify({ action: "chat", message: text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Builder API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
