"use client";

import { useState } from "react";
import Link from "next/link";

const FACES = [
  {
    id: "board",
    title: "Circuit Board",
    desc: "A living PCB with your agent's name on the center chip. Data pulses stream the traces, components flash as signals hit them.",
    color: "from-green-50 to-emerald-50",
    border: "border-green-200",
  },
  {
    id: "radial",
    title: "Radial Starburst",
    desc: "80-bar starburst around a living particle orb. Thousands of grains rotate, churn, and detonate from the core with every syllable.",
    color: "from-blue-50 to-cyan-50",
    border: "border-blue-200",
  },
  {
    id: "rain",
    title: "Face in the Code",
    desc: "Matrix rain that idles like a screensaver, until the agent speaks and a face surfaces inside the glyphs.",
    color: "from-purple-50 to-violet-50",
    border: "border-purple-200",
  },
  {
    id: "neural",
    title: "Neural Core",
    desc: "A constellation brain with labeled color islands, traveling thought-pulses, and a CORTEX STATUS panel.",
    color: "from-orange-50 to-red-50",
    border: "border-orange-200",
  },
];

export default function VisualizerPage() {
  const [selectedFace, setSelectedFace] = useState("board");
  const [isRunning, setIsRunning] = useState(false);

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
            <h1 className="text-slate-900 font-semibold">AI Visualizer</h1>
          </div>
          <span className="text-sm text-slate-400">by Agapitos Kalafatas</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Agent <span className="gradient-text">Visualizer</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Full-screen faces that idle, listen, think, and speak in sync with your AI agent.
            Four faces ship — pick your favorite.
          </p>
        </div>

        {/* Face Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {FACES.map((face) => (
            <div
              key={face.id}
              onClick={() => setSelectedFace(face.id)}
              className={`bg-gradient-to-br ${face.color} border ${face.border} rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] ${
                selectedFace === face.id ? "ring-2 ring-brand-500 shadow-lg" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-slate-900">{face.title}</h3>
                {selectedFace === face.id && (
                  <span className="bg-brand-500 text-white text-xs px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">{face.desc}</p>
            </div>
          ))}
        </div>

        {/* Preview Area */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-white px-6 py-3 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-slate-500 text-sm font-mono">
                visualizer — {selectedFace}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
              <span className="text-slate-500 text-sm">
                {isRunning ? "Running" : "Stopped"}
              </span>
            </div>
          </div>

          <div className="aspect-video bg-slate-900 flex items-center justify-center relative">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {selectedFace === "board" && " "}
                {selectedFace === "radial" && " "}
                {selectedFace === "rain" && " "}
                {selectedFace === "neural" && " "}
              </div>
              <p className="text-white text-lg mb-2">
                {selectedFace.charAt(0).toUpperCase() + selectedFace.slice(1)} Visualizer
              </p>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                Run the visualizer server locally to see the live face.
                <br />
                <code className="text-brand-400">python components/ai-visualizer/server.py</code>
              </p>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  isRunning
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : "bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/25"
                }`}
              >
                {isRunning ? "Stop Demo" : "Start Demo"}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Start</h3>
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
            <p className="text-slate-400"># Clone and run the visualizer</p>
            <p className="text-green-400">cd components/ai-visualizer</p>
            <p className="text-green-400">python server.py</p>
            <p className="text-slate-400 mt-2"># Opens browser at http://127.0.0.1:8790/</p>
          </div>
        </div>
      </div>
    </main>
  );
}
