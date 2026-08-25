"use client";

import Link from "next/link";

const PROMPTS = [
  {
    title: "The Voice Line",
    file: "voice-line-prompt.md",
    desc: "Hold a key, talk to your agent out loud, release, and it answers through your speakers in a real voice. Everything runs local.",
    tags: ["voice", "local", "free"],
  },
  {
    title: "The Voice Line: Windows",
    file: "voice-line-prompt-windows.md",
    desc: "The same proven build, written native for Windows with input handling and service fixes.",
    tags: ["voice", "windows", "native"],
  },
  {
    title: "The Visualizer",
    file: "visualizer-prompt.md",
    desc: "A fullscreen browser scene that reacts to your voice agent as it listens, thinks, and speaks.",
    tags: ["visual", "browser", "canvas"],
  },
  {
    title: "The Cinematic Camera",
    file: "cinematic-camera-prompt.md",
    desc: "Add-on for the visualizer. Press spacebar for a scripted, movie-style flythrough of your scene.",
    tags: ["camera", "cinematic", "add-on"],
  },
];

export default function PromptsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
              ← Home
            </Link>
            <div className="w-px h-6 bg-slate-200" />
            <h1 className="text-slate-900 font-semibold">Prompts</h1>
          </div>
          <span className="text-sm text-slate-400">by Agapitos Kalafatas</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Agent <span className="gradient-text">Prompts</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Paste these prompts into your AI agent. It builds the thing.
            Real builds from real use, written up so your agent gets it right the first time.
          </p>
        </div>

        {/* Prompts Grid */}
        <div className="space-y-6">
          {PROMPTS.map((prompt, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg hover:shadow-slate-900/5 hover:border-brand-200 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{prompt.title}</h3>
                  <p className="text-slate-500 leading-relaxed mb-4">{prompt.desc}</p>
                  <div className="flex gap-2">
                    {prompt.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  <code className="text-slate-400 text-xs bg-slate-50 px-3 py-2 rounded-lg">
                    {prompt.file}
                  </code>
                  <a
                    href={`https://github.com/jaredrhod/prompts/blob/main/${prompt.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 hover:text-brand-600 text-sm transition-colors"
                  >
                    View on GitHub →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Usage */}
        <div className="mt-12 bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">How to Use</h3>
          <div className="space-y-4 text-slate-500">
            <div className="flex gap-3">
              <span className="text-brand-500 font-bold">1.</span>
              <p>Open Claude Code, Gemini, or any terminal AI on your computer</p>
            </div>
            <div className="flex gap-3">
              <span className="text-brand-500 font-bold">2.</span>
              <p>Copy the whole prompt file and paste it in</p>
            </div>
            <div className="flex gap-3">
              <span className="text-brand-500 font-bold">3.</span>
              <p>Let it build. Your agent installs what it needs, writes the code, and verifies it works</p>
            </div>
          </div>
          <div className="mt-6 bg-slate-900 rounded-lg p-4 font-mono text-sm">
            <p className="text-slate-400"># Visit jaredrhod.com/prompts for copy buttons</p>
            <p className="text-slate-400"># Each prompt carries hard-won lessons from real builds</p>
          </div>
        </div>
      </div>
    </main>
  );
}
