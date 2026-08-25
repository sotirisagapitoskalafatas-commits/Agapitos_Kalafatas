"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MemoryFile {
  name: string;
  path: string;
  content: string;
  modified: string;
}

const VAULT_STRUCTURE = [
  { folder: "lessons", desc: "Things learned from our work together", icon: " " },
  { folder: "projects", desc: "Project context and status", icon: " " },
  { folder: "preferences", desc: "Your preferences and settings", icon: "⚙️" },
  { folder: "conversations", desc: "Notable conversation summaries", icon: " " },
  { folder: "skills", desc: "Skills the agent has learned", icon: " " },
];

export default function MemoryPage() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null);
  const [activeTab, setActiveTab] = useState("vault");
  const [newNote, setNewNote] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("lessons");

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
            <h1 className="text-white font-semibold">Memory Vault</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/jaredrhod/ai-memory-vault"
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
            AI <span className="gradient-text">Memory Vault</span>
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Persistent, unlimited memory for your AI agent. Plain text files it reads and writes
            to remember you, your work, and every lesson across sessions.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: "vault", label: "Vault Explorer" },
            { id: "structure", label: "Structure" },
            { id: "write", label: "Write Note" },
            { id: "about", label: "About" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-brand-500 text-white"
                  : "bg-dark-800 text-dark-300 hover:bg-dark-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Vault Explorer Tab */}
        {activeTab === "vault" && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Folder List */}
            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Folders</h3>
              <div className="space-y-2">
                {VAULT_STRUCTURE.map((item) => (
                  <button
                    key={item.folder}
                    onClick={() => setSelectedFolder(item.folder)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                      selectedFolder === item.folder
                        ? "bg-brand-500/20 border border-brand-500/30"
                        : "bg-dark-900/50 hover:bg-dark-700/50"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="text-white text-sm font-medium">{item.folder}</div>
                      <div className="text-dark-400 text-xs">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* File List */}
            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                {selectedFolder}/
              </h3>
              <div className="space-y-2">
                <div className="bg-dark-900/50 rounded-lg p-4 text-center">
                  <p className="text-dark-400 text-sm">
                    No files in this folder yet.
                  </p>
                  <p className="text-dark-500 text-xs mt-1">
                    Create notes via the Write Note tab
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Preview</h3>
              <div className="bg-dark-950 rounded-lg p-4 min-h-[200px]">
                <p className="text-dark-400 text-sm italic">
                  Select a file to preview its contents...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Structure Tab */}
        {activeTab === "structure" && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">How It Works</h3>
              <div className="space-y-4 text-dark-300">
                <div className="flex gap-3">
                  <span className="text-brand-400 font-bold">1.</span>
                  <p>Your agent reads files from the vault at the start of every conversation</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-400 font-bold">2.</span>
                  <p>It writes lessons, project context, and preferences as it works</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-400 font-bold">3.</span>
                  <p>Memory persists across sessions with no size ceiling</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-400 font-bold">4.</span>
                  <p>You own the files — plain text, readable and editable anytime</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">Vault Structure</h3>
              <div className="bg-dark-950 rounded-lg p-4 font-mono text-sm space-y-1">
                <p className="text-green-400">agent/memory/</p>
                <p className="text-dark-300">├── lessons/</p>
                <p className="text-dark-300">├── projects/</p>
                <p className="text-dark-300">├── preferences/</p>
                <p className="text-dark-300">├── conversations/</p>
                <p className="text-dark-300">├── skills/</p>
                <p className="text-dark-300">└── README.md</p>
              </div>
            </div>
          </div>
        )}

        {/* Write Note Tab */}
        {activeTab === "write" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">Write a Note</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-dark-300 text-sm mb-2 block">Folder</label>
                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500"
                  >
                    {VAULT_STRUCTURE.map((item) => (
                      <option key={item.folder} value={item.folder}>
                        {item.icon} {item.folder}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-dark-300 text-sm mb-2 block">Title</label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-dark-300 text-sm mb-2 block">Content</label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write your note in markdown..."
                    rows={10}
                    className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-3 text-white placeholder-dark-400 font-mono text-sm resize-none focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button className="w-full bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-medium transition-all">
                  Save to Vault
                </button>
              </div>
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">About AI Memory Vault</h3>
              <div className="space-y-4 text-dark-300 leading-relaxed">
                <p>
                  AI Memory Vault is an open-source system by{" "}
                  <a href="https://github.com/jaredrhod" className="text-brand-400 hover:underline">
                    Agapitos Kalafatas
                  </a>{" "}
                  that turns plain text files into your AI&apos;s persistent memory.
                </p>
                <p>
                  Instead of relying on the model&apos;s limited context window, your agent reads
                  and writes files on disk. This means unlimited memory, full transparency,
                  and the ability for you to edit anything directly.
                </p>
                <p>
                  <strong className="text-white">AI Priming:</strong> Before your agent does a task,
                  it reads the relevant notes from the vault. Writing a marketing email? It reads
                  your copywriting notes, email marketing notes, and customer avatar first.
                </p>
                <div className="bg-dark-950 rounded-lg p-4 font-mono text-sm mt-6">
                  <p className="text-dark-400"># Full setup with Obsidian</p>
                  <p className="text-green-400">git clone https://github.com/jaredrhod/ai-memory-vault</p>
                  <p className="text-green-400">cd ai-memory-vault</p>
                  <p className="text-green-400">python setup.py</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
