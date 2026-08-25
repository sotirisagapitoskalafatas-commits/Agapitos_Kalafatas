"use client";

import { useState } from "react";
import Link from "next/link";

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [htmlCode, setHtmlCode] = useState(
    '<div style="display:flex;height:100vh;align-items:center;justify-content:center;background:#f8fafc;color:#94a3b8;font-family:system-ui;"><div style="text-align:center;"><p style="font-size:48px;margin-bottom:16px;"> </p><p style="font-size:18px;">Your AI-generated website will appear here...</p><p style="font-size:14px;margin-top:8px;color:#cbd5e1;">Type a prompt and click Generate</p></div></div>'
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  const generateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const html = await response.text();
      setHtmlCode(html);
      setActiveTab("preview");
    } catch (error) {
      setHtmlCode(
        '<div style="display:flex;height:100vh;align-items:center;justify-content:center;background:#fef2f2;color:#dc2626;font-family:system-ui;"><p>Generation failed. Please try again.</p></div>'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
              ← Home
            </Link>
            <div className="w-px h-6 bg-slate-200" />
            <h1 className="text-slate-900 font-semibold">AI Website Builder</h1>
          </div>
          <span className="text-sm text-slate-400">by Agapitos Kalafatas</span>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-slate-200 p-6 flex flex-col">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Website Generator</h2>
            <p className="text-sm text-slate-500 mb-6">
              Describe your vision and the AI engine will build a live page instantly.
            </p>

            <form onSubmit={generateWebsite} className="space-y-4">
              <textarea
                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                placeholder="e.g., A luxury real estate portfolio for waterfront properties in Glyfada, Athens with hero section, property listings, and contact form..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-brand-500/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate Website"
                )}
              </button>
            </form>
          </div>

          {/* Quick prompts */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Prompts</h3>
            <div className="space-y-2">
              {[
                "Modern SaaS landing page with pricing section",
                "Portfolio for a photographer in Santorini",
                "Restaurant website with menu and reservations",
                "Tech startup landing page with product features",
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(q)}
                  className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6">
            <p className="text-xs text-slate-400">Powered by Gemini AI & Tailwind CSS</p>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "preview"
                  ? "text-brand-600 border-b-2 border-brand-500"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "code"
                  ? "text-brand-600 border-b-2 border-brand-500"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              HTML Code
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === "preview" ? (
              <iframe
                srcDoc={htmlCode}
                title="AI Generated Website Preview"
                className="w-full h-full border-none"
                sandbox="allow-scripts"
              />
            ) : (
              <pre className="p-6 bg-slate-900 text-slate-300 text-xs overflow-auto h-full font-mono">
                {htmlCode}
              </pre>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
