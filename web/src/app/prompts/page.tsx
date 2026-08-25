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
    <main className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-dark-400 hover:text-white transition-colors">
              ← Home
            </Link>
            <div className="w-px h-6 bg-dark-700" />
            <h1 className="text-white font-semibold">Prompts</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/jaredrhod/prompts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-400 hover:text-white text-sm transition-colors"
            >
              by Agapitos Kalafatas
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Agent <span className="gradient-text">Prompts</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Paste these prompts into your AI agent. It builds the thing.
            Real builds from real use, written up so your agent gets it right the first time.
          </p>
        </div>

        {/* Prompts Grid */}
        <div className="space-y-6">
          {PROMPTS.map((prompt, i) => (
            <div
              key={i}
              className="bg-dark-800/50 border border-dark-700 rounded-2xl p-8 hover:border-brand-500/50 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{prompt.title}</h3>
                  <p className="text-dark-300 leading-relaxed mb-4">{prompt.desc}</p>
                  <div className="flex gap-2">
                    {prompt.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-dark-700 text-dark-300 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  <code className="text-dark-400 text-xs bg-dark-950 px-3 py-2 rounded-lg">
                    {prompt.file}
                  </code>
                  <a
                    href={`https://github.com/jaredrhod/prompts/blob/main/${prompt.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-400 hover:text-brand-300 text-sm transition-colors"
                  >
                    View on GitHub →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Usage */}
        <div className="mt-12 bg-dark-800/50 border border-dark-700 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-6">How to Use</h3>
          <div className="space-y-4 text-dark-300">
            <div className="flex gap-3">
              <span className="text-brand-400 font-bold">1.</span>
              <p>Open Claude Code, Gemini, or any terminal AI on your computer</p>
            </div>
            <div className="flex gap-3">
              <span className="text-brand-400 font-bold">2.</span>
              <p>Copy the whole prompt file and paste it in</p>
            </div>
            <div className="flex gap-3">
              <span className="text-brand-400 font-bold">3.</span>
              <p>Let it build. Your agent installs what it needs, writes the code, and verifies it works</p>
            </div>
          </div>
          <div className="mt-6 bg-dark-950 rounded-lg p-4 font-mono text-sm">
            <p className="text-dark-400"># Visit jaredrhod.com/prompts for copy buttons</p>
            <p className="text-dark-400"># Each prompt carries hard-won lessons from real builds</p>
          </div>
        </div>
      </div>
    </main>
  );
}
