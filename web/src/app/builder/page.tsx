"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface BuilderMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function BuilderPage() {
  const [messages, setMessages] = useState<BuilderMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Welcome to **Atlas Builder** — your AI website designer.\n\nTell me what kind of website you want and I'll build it for you. For example:\n\n- "A luxury real estate site for waterfront villas in Athens"\n- "A modern SaaS landing page for an AI analytics tool"\n- "A restaurant website with menu and reservation form"\n\nYou can also **upload images** and I'll incorporate them into the design. What would you like to create?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [htmlCode, setHtmlCode] = useState("");
  const [siteName, setSiteName] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "preview" | "code">("chat");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeTab]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setUploadedImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: BuilderMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          currentHtml: htmlCode || undefined,
          siteName: siteName || undefined,
          images: uploadedImages.length > 0 ? uploadedImages : undefined,
        }),
      });

      const data = await response.json();

      if (data.action === "generate" || data.action === "modify") {
        setHtmlCode(data.html);
        setSiteName(data.siteName || "My Website");
        setActiveTab("preview");
        setUploadedImages([]);

        const assistantMsg: BuilderMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `**${data.siteName || "Website"}** is ready!\n\n${data.description || "Here's your website."}\n\nYou can:\n- Switch to **Preview** tab to see it live\n- Tell me changes like "make the hero darker" or "add a gallery section"\n- Upload more images to incorporate\n- Ask me to add specific features`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Filter out any JSON/HTML that leaked through
        let cleanMessage = data.message || "I'm here to help. Tell me what website you'd like to create.";
        if (cleanMessage.includes('"action"') || cleanMessage.includes('<!DOCTYPE') || cleanMessage.includes('```')) {
          cleanMessage = "I'm ready to build your website. Tell me what you'd like — describe it, share a reference URL, or upload images.";
        }
        const assistantMsg: BuilderMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: cleanMessage,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (error) {
      const errorMsg: BuilderMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const downloadHtml = () => {
    const blob = new Blob([htmlCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${siteName.replace(/\s+/g, "-").toLowerCase() || "website"}.html`;
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
            <h1 className="text-slate-900 font-semibold">Atlas Builder</h1>
            {siteName && (
              <span className="text-sm text-slate-400">— {siteName}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {htmlCode && (
              <button
                onClick={downloadHtml}
                className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                Download HTML
              </button>
            )}
            <span className="text-sm text-slate-400">by Agapitos Kalafatas</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex" style={{ height: "calc(100vh - 65px)" }}>
        {/* Chat Panel */}
        <div className={`flex flex-col ${activeTab === "chat" ? "flex-1" : "w-[400px]"} border-r border-slate-200 transition-all`}>
          {/* Chat tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "chat"
                  ? "text-brand-600 border-brand-500"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "preview"
                  ? "text-brand-600 border-brand-500"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
              disabled={!htmlCode}
            >
              Preview {htmlCode ? "✓" : ""}
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === "code"
                  ? "text-brand-600 border-brand-500"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
              disabled={!htmlCode}
            >
              Code {htmlCode ? "✓" : ""}
            </button>
          </div>

          {/* Chat messages */}
          {activeTab === "chat" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-brand-500 text-white rounded-br-md"
                        : "bg-slate-100 text-slate-700 rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-4 h-4 bg-brand-100 rounded flex items-center justify-center">
                          <span className="text-brand-600 text-[10px] font-bold">A</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Atlas Builder</span>
                      </div>
                    )}
                    <div className={`prose prose-sm max-w-none ${msg.role === "user" ? "prose-invert" : ""}`}>
                      {msg.content.split("\n").map((line, i) => {
                        if (line.startsWith("- ")) {
                          return (
                            <div key={i} className="flex gap-2 ml-2">
                              <span>•</span>
                              <span>{line.slice(2)}</span>
                            </div>
                          );
                        }
                        if (line.startsWith("**") && line.endsWith("**")) {
                          return <strong key={i}>{line.replace(/\*\*/g, "")}</strong>;
                        }
                        return <div key={i}>{line || <br />}</div>;
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full typing-dot" />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full typing-dot" />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input area */}
          {activeTab === "chat" && (
            <div className="border-t border-slate-200 p-3">
              {/* Uploaded images preview */}
              {uploadedImages.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0"
                  title="Upload images"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your website, upload images, or ask for changes..."
                  rows={1}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
              <p className="text-[10px] text-slate-300 mt-1.5 text-center">
                Powered by Atlas Builder • Agapitos Kalafatas
              </p>
            </div>
          )}

          {/* Preview / Code (shown when not on chat tab) */}
          {activeTab !== "chat" && (
            <div className="flex-1">
              {!htmlCode ? (
                <div className="h-full flex items-center justify-center bg-slate-50">
                  <p className="text-slate-400">Describe a website in the chat to get started</p>
                </div>
              ) : activeTab === "preview" ? (
                <iframe
                  srcDoc={htmlCode}
                  title="Website Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <pre className="p-4 bg-slate-900 text-slate-300 text-xs overflow-auto h-full font-mono leading-relaxed">
                  {htmlCode}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Side panel when on chat - show preview */}
        {activeTab === "chat" && htmlCode && (
          <div className="flex-1">
            <iframe
              srcDoc={htmlCode}
              title="Live Preview"
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}

        {/* Empty state */}
        {activeTab === "chat" && !htmlCode && (
          <div className="flex-1 hidden lg:flex items-center justify-center bg-slate-50">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4"> </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Build Your Website with AI</h3>
              <p className="text-slate-400 text-sm">
                Chat with Atlas Builder to describe your vision, upload images, and get a live preview instantly.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                {[
                  "Describe your business",
                  "Upload your images",
                  "Iterate with feedback",
                  "Download production HTML",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
