"use client";

import { useState } from "react";
import Link from "next/link";

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Generation failed");
      }

      const html = await response.text();
      if (!html || !html.includes("<")) {
        throw new Error("Invalid response from AI");
      }

      setHtmlCode(html);
      setHasGenerated(true);
      setActiveTab("preview");
    } catch (err: any) {
      setError(err.message || "Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadHtml = () => {
    const blob = new Blob([htmlCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-website.html";
    a.click();
    URL.revokeObjectURL(url);
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

      <div className="flex-1 flex" style={{ height: "calc(100vh - 65px)" }}>
        {/* Sidebar */}
        <div className="w-[380px] border-r border-slate-200 p-6 flex flex-col overflow-y-auto">
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

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Prompts</h3>
            <div className="space-y-2">
              {[
                "Modern SaaS landing page with pricing section, testimonials, and a hero with gradient background",
                "Portfolio for a professional photographer in Santorini with gallery grid and booking form",
                "Restaurant website with menu sections, reservation form, and photo gallery",
                "Tech startup landing page with animated hero, product features, and investor CTA",
                "Law firm website with services, team profiles, and contact form",
                "Fitness gym website with class schedule, trainer profiles, and membership plans",
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(q)}
                  className="w-full text-left px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 transition-all leading-relaxed"
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
          <div className="flex items-center justify-between border-b border-slate-200 px-4">
            <div className="flex">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeTab === "preview"
                    ? "text-brand-600 border-brand-500"
                    : "text-slate-400 border-transparent hover:text-slate-600"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeTab === "code"
                    ? "text-brand-600 border-brand-500"
                    : "text-slate-400 border-transparent hover:text-slate-600"
                }`}
              >
                HTML Code
              </button>
            </div>
            {hasGenerated && (
              <button
                onClick={downloadHtml}
                className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                Download HTML
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            {!hasGenerated && !loading ? (
              <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                  <div className="text-6xl mb-4"> </div>
                  <p className="text-slate-400 text-lg mb-2">Your AI-generated website will appear here</p>
                  <p className="text-slate-400 text-sm">Type a prompt and click Generate</p>
                </div>
              </div>
            ) : loading ? (
              <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">Building your website...</p>
                  <p className="text-slate-400 text-sm mt-1">This usually takes 10-20 seconds</p>
                </div>
              </div>
            ) : activeTab === "preview" ? (
              <iframe
                srcDoc={htmlCode}
                title="AI Generated Website Preview"
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <pre className="p-6 bg-slate-900 text-slate-300 text-xs overflow-auto h-full font-mono leading-relaxed">
                {htmlCode}
              </pre>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
