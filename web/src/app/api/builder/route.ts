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

    const systemPrompt = `You are Atlas Builder, an expert web designer. You create real, production-ready websites through conversation.

IMPORTANT: When the user asks you to create/modify a website, you MUST follow their exact request. If they show you a reference URL, study it and build something similar but better. Never ignore what the user asks for.

WHEN GENERATING OR MODIFYING A WEBSITE:
Output ONLY a JSON object, no other text:
{"action":"generate","html":"<complete HTML>","siteName":"name","description":"short 1 sentence description of what you built"}

For modifications:
{"action":"modify","html":"<complete modified HTML>","siteName":"name","description":"what you changed"}

WHEN JUST CHATTING (not generating/modifying):
Respond naturally as Atlas Builder in plain text. No JSON.

HTML RULES:
1. Complete standalone HTML starting with <!DOCTYPE html> ending with </html>
2. <head> must include: <script src="https://cdn.tailwindcss.com"></script>, Google Fonts Inter, meta viewport
3. Sections: Nav bar, Hero, Features/Products, About, Contact Form, Footer
4. Contact form MUST have: Name, Email, Phone (optional), Message fields
5. Contact form submits via: fetch('/api/site-leads',{method:'POST',headers:{"Content-Type":"application/json"},body:JSON.stringify({siteId:"UNIQUE_ID",siteName:"SITE_NAME",name,email,phone,message})})
6. Generate a unique 8-char alphanumeric siteId
7. All styling via Tailwind classes
8. Responsive with sm: md: lg: prefixes
9. Smooth CSS animations in <style> tag
10. Use placeholder images from https://picsum.photos/seed/xxx/width/height or unsplash
11. If user provides images, use them in the design
12. Footer must include "Powered by Agapitos Kalafatas"
13. Make it look professional and modern

CRITICAL: The JSON html field must contain the COMPLETE HTML. Do not truncate it. Do not wrap in code blocks.`;

    const contents = [];

    // Add conversation history (only last 10 messages to avoid token limits)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
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
          const [header, data] = img.split(",");
          const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
          parts.push({ inlineData: { mimeType, data } });
        } else {
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
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.7,
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
      // Find the JSON object in the response
      const jsonStart = text.indexOf('{"action"');
      if (jsonStart !== -1) {
        // Find matching closing brace
        let depth = 0;
        let jsonEnd = jsonStart;
        for (let i = jsonStart; i < text.length; i++) {
          if (text[i] === "{") depth++;
          if (text[i] === "}") depth--;
          if (depth === 0) { jsonEnd = i + 1; break; }
        }
        const jsonStr = text.substring(jsonStart, jsonEnd);
        const parsed = JSON.parse(jsonStr);
        if (parsed.html) {
          parsed.html = parsed.html.replace(/```html\s*/gi, "").replace(/```\s*/gm, "").trim();
          // Remove any leading/trailing text that's not HTML
          const doctypeIdx = parsed.html.indexOf("<!DOCTYPE");
          const htmlIdx = parsed.html.indexOf("<html");
          if (doctypeIdx === -1 && htmlIdx > 0) parsed.html = parsed.html.substring(htmlIdx);
          const htmlEnd = parsed.html.lastIndexOf("</html>");
          if (htmlEnd > 0) parsed.html = parsed.html.substring(0, htmlEnd + 7);
        }
        return new Response(JSON.stringify(parsed), {
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      // Not JSON, return as chat
    }

    return new Response(JSON.stringify({ action: "chat", message: text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Builder API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
