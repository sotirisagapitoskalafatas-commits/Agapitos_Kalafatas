"use client";

import { useState } from "react";
import Link from "next/link";

const SKILLS = [
  {
    id: "principles",
    title: "Core Principles",
    file: "jareds-takes.md",
    desc: "35 marketing principles from real business experience. The foundation everything sits on.",
    icon: " ",
  },
  {
    id: "fundamentals",
    title: "The Fundamentals",
    file: "the-fundamentals.md",
    desc: "The whole sales funnel start to finish: Content, Lead Magnet, Tripwire, Core Offer, Profit Maximizer.",
    icon: " ",
  },
  {
    id: "copywriting",
    title: "Copywriting",
    file: "marketing-copywriting.md",
    desc: "The words that make people buy. Headlines, hooks, and persuasion frameworks.",
    icon: "✍️",
  },
  {
    id: "sales-letter",
    title: "Sales Letters",
    file: "marketing-sales-letter.md",
    desc: "David Frey's 12-step structure for long-form sales letters and pages.",
    icon: " ",
  },
  {
    id: "email",
    title: "Email Marketing",
    file: "marketing-email.md",
    desc: "The highest-ROI channel, run right. Sequences, automations, and copy.",
    icon: "✉️",
  },
  {
    id: "fb-ads",
    title: "Facebook Ads",
    file: "marketing-fb-ads.md",
    desc: "Paid ads and where they actually fit — top of funnel, not the close.",
    icon: " ",
  },
  {
    id: "content",
    title: "Content Strategy",
    file: "marketing-content.md",
    desc: "The content library that moves people through the funnel.",
    icon: " ",
  },
  {
    id: "analytics",
    title: "Analytics",
    file: "marketing-analytics.md",
    desc: "Which numbers to track and how to turn them into decisions.",
    icon: " ",
  },
  {
    id: "lead-magnets",
    title: "Lead Magnets",
    file: "marketing-lead-magnets.md",
    desc: "The offer that turns a stranger into a lead.",
    icon: " ",
  },
];

export default function MarketingPage() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

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
            <h1 className="text-white font-semibold">Marketing Skills</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/jaredrhod/ai-marketing-skills"
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
            AI <span className="gradient-text">Marketing Skills</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            The marketing fundamentals that make AI actually make you money.
            Written by Agapitos Kalafatas from real business experience.
          </p>
        </div>

        {/* AI Priming Banner */}
        <div className="bg-gradient-to-r from-brand-950/50 to-dark-900/50 border border-brand-500/30 rounded-2xl p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="text-4xl"> </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">AI Priming</h3>
              <p className="text-dark-300 leading-relaxed">
                Before your AI writes marketing copy, it reads the relevant notes from these playbooks.
                Context is king — when you &quot;prime&quot; your AI with the knowledge it needs before output,
                results are always better and more accurate.
              </p>
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SKILLS.map((skill) => (
            <div
              key={skill.id}
              onClick={() => setSelectedSkill(selectedSkill === skill.id ? null : skill.id)}
              className={`bg-dark-800/50 border rounded-2xl p-6 cursor-pointer transition-all hover:border-brand-500/50 ${
                selectedSkill === skill.id
                  ? "border-brand-500 ring-1 ring-brand-500/30"
                  : "border-dark-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{skill.icon}</span>
                  <h3 className="text-lg font-bold text-white">{skill.title}</h3>
                </div>
              </div>
              <p className="text-dark-300 text-sm leading-relaxed mb-3">{skill.desc}</p>
              <div className="bg-dark-950 rounded-lg px-3 py-2">
                <code className="text-dark-400 text-xs">{skill.file}</code>
              </div>
            </div>
          ))}
        </div>

        {/* How to Use */}
        <div className="mt-12 bg-dark-800/50 border border-dark-700 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-6">How to Use</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-3">Option 1: As a Claude Skill</h4>
              <div className="bg-dark-950 rounded-lg p-4 font-mono text-sm space-y-1">
                <p className="text-dark-400"># Upload the jaredrhod-marketing folder</p>
                <p className="text-dark-400"># to Claude&apos;s Skills interface</p>
                <p className="text-dark-400"># Claude reads the right playbook automatically</p>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Option 2: In Your Vault</h4>
              <div className="bg-dark-950 rounded-lg p-4 font-mono text-sm space-y-1">
                <p className="text-dark-400"># Copy files to your vault/Marketing/</p>
                <p className="text-dark-400"># Add a Marketing.md index note</p>
                <p className="text-dark-400"># Your agent primes itself before any task</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
