"use client";

import { useState } from "react";
import Link from "next/link";

const FACES = [
  {
    id: "board",
    title: "Circuit Board",
    desc: "A living PCB with your agent's name on the center chip. Data pulses stream the traces, components flash as signals hit them.",
    color: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30",
  },
  {
    id: "radial",
    title: "Radial Starburst",
    desc: "80-bar starburst around a living particle orb. Thousands of grains rotate, churn, and detonate from the core with every syllable.",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
  },
  {
    id: "rain",
    title: "Face in the Code",
    desc: "Matrix rain that idles like a screensaver, until the agent speaks and a face surfaces inside the glyphs.",
    color: "from-purple-500/20 to-violet-500/20",
    border: "border-purple-500/30",
  },
  {
    id: "neural",
    title: "Neural Core",
    desc: "A constellation brain with labeled color islands, traveling thought-pulses, and a CORTEX STATUS panel.",
    color: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/30",
  },
];

export default function VisualizerPage() {
  const [selectedFace, setSelectedFace] = useState("board");
  const [isRunning, setIsRunning] = useState(false);

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
            <h1 className="text-white font-semibold">AI Visualizer</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/jaredrhod/ai-visualizer"
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
            Agent <span className="gradient-text">Visualizer</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
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
                selectedFace === face.id ? "ring-2 ring-brand-500" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-white">{face.title}</h3>
                {selectedFace === face.id && (
                  <span className="bg-brand-500 text-white text-xs px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-dark-300 text-sm leading-relaxed">{face.desc}</p>
            </div>
          ))}
        </div>

        {/* Preview Area */}
        <div className="bg-dark-900 border border-dark-700 rounded-2xl overflow-hidden">
          <div className="bg-dark-800 px-6 py-3 flex items-center justify-between border-b border-dark-700">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-dark-400 text-sm font-mono">
                visualizer — {selectedFace}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-dark-500"}`} />
              <span className="text-dark-400 text-sm">
                {isRunning ? "Running" : "Stopped"}
              </span>
            </div>
          </div>

          <div className="aspect-video bg-dark-950 flex items-center justify-center relative">
            {/* Visualizer Canvas Placeholder */}
            <div className="text-center">
              <div className="text-6xl mb-4">
                {selectedFace === "board" && " "}
                {selectedFace === "radial" && " "}
                {selectedFace === "rain" && " "}
                {selectedFace === "neural" && " "}
              </div>
              <p className="text-dark-400 text-lg mb-2">
                {selectedFace.charAt(0).toUpperCase() + selectedFace.slice(1)} Visualizer
              </p>
              <p className="text-dark-500 text-sm mb-6 max-w-md mx-auto">
                Run the visualizer server locally to see the live face.
                <br />
                <code className="text-brand-400">python components/ai-visualizer/server.py</code>
              </p>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  isRunning
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : "bg-brand-500 text-white hover:bg-brand-600"
                }`}
              >
                {isRunning ? "Stop Demo" : "Start Demo"}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mt-8 bg-dark-800/50 border border-dark-700 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-4">Quick Start</h3>
          <div className="bg-dark-950 rounded-lg p-4 font-mono text-sm">
            <p className="text-dark-400"># Clone and run the visualizer</p>
            <p className="text-green-400">cd components/ai-visualizer</p>
            <p className="text-green-400">python server.py</p>
            <p className="text-dark-400 mt-2"># Opens browser at http://127.0.0.1:8790/</p>
          </div>
        </div>
      </div>
    </main>
  );
}
