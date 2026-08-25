"use client";

import { useState } from "react";
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
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
              ← Home
            </Link>
            <div className="w-px h-6 bg-slate-200" />
            <h1 className="text-slate-900 font-semibold">Memory Vault</h1>
          </div>
          <span className="text-sm text-slate-400">by Agapitos Kalafatas</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            AI <span className="gradient-text">Memory Vault</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
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
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
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
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Folders</h3>
              <div className="space-y-2">
                {VAULT_STRUCTURE.map((item) => (
                  <button
                    key={item.folder}
                    onClick={() => setSelectedFolder(item.folder)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                      selectedFolder === item.folder
                        ? "bg-brand-50 border border-brand-200"
                        : "bg-white hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="text-slate-900 text-sm font-medium">{item.folder}</div>
                      <div className="text-slate-400 text-xs">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* File List */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                {selectedFolder}/
              </h3>
              <div className="space-y-2">
                <div className="bg-white rounded-lg p-4 text-center border border-slate-200">
                  <p className="text-slate-400 text-sm">
                    No files in this folder yet.
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Create notes via the Write Note tab
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Preview</h3>
              <div className="bg-white rounded-lg p-4 min-h-[200px] border border-slate-200">
                <p className="text-slate-400 text-sm italic">
                  Select a file to preview its contents...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Structure Tab */}
        {activeTab === "structure" && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">How It Works</h3>
              <div className="space-y-4 text-slate-500">
                <div className="flex gap-3">
                  <span className="text-brand-500 font-bold">1.</span>
                  <p>Your agent reads files from the vault at the start of every conversation</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-500 font-bold">2.</span>
                  <p>It writes lessons, project context, and preferences as it works</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-500 font-bold">3.</span>
                  <p>Memory persists across sessions with no size ceiling</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-brand-500 font-bold">4.</span>
                  <p>You own the files — plain text, readable and editable anytime</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Vault Structure</h3>
              <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm space-y-1">
                <p className="text-green-400">agent/memory/</p>
                <p className="text-slate-300">├── lessons/</p>
                <p className="text-slate-300">├── projects/</p>
                <p className="text-slate-300">├── preferences/</p>
                <p className="text-slate-300">├── conversations/</p>
                <p className="text-slate-300">├── skills/</p>
                <p className="text-slate-300">└── README.md</p>
              </div>
            </div>
          </div>
        )}

        {/* Write Note Tab */}
        {activeTab === "write" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Write a Note</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-500 text-sm mb-2 block">Folder</label>
                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    {VAULT_STRUCTURE.map((item) => (
                      <option key={item.folder} value={item.folder}>
                        {item.icon} {item.folder}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 text-sm mb-2 block">Title</label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-sm mb-2 block">Content</label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write your note in markdown..."
                    rows={10}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 font-mono text-sm resize-none focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <button className="w-full bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-brand-500/25">
                  Save to Vault
                </button>
              </div>
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">About AI Memory Vault</h3>
              <div className="space-y-4 text-slate-500 leading-relaxed">
                <p>
                  AI Memory Vault is an open-source system by{" "}
                  <span className="text-brand-500 font-medium">
                    Agapitos Kalafatas
                  </span>{" "}
                  that turns plain text files into your AI&apos;s persistent memory.
                </p>
                <p>
                  Instead of relying on the model&apos;s limited context window, your agent reads
                  and writes files on disk. This means unlimited memory, full transparency,
                  and the ability for you to edit anything directly.
                </p>
                <p>
                  <strong className="text-slate-900">AI Priming:</strong> Before your agent does a task,
                  it reads the relevant notes from the vault. Writing a marketing email? It reads
                  your copywriting notes, email marketing notes, and customer avatar first.
                </p>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm mt-6">
                  <p className="text-slate-400"># Full setup with Obsidian</p>
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
