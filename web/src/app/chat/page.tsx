"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import gsap from "gsap";
import Scene3DBackground from "@/components/Scene3DBackground";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm Atlas, the AI agent built by Agapitos Kalafatas. I can help you understand his work, discuss full-stack architecture, or talk about any software engineering topic. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Animate chat container on mount
  useEffect(() => {
    gsap.fromTo(".chat-header", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
    gsap.fromTo(".chat-messages", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.2 });
    gsap.fromTo(".chat-input", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.4 });
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I encountered an error. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having trouble connecting. Please make sure the API is configured and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="chat-header border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-slate-900 transition-colors"
            >
              ← Home
            </Link>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="text-slate-900 font-semibold">Atlas AI</h1>
                <p className="text-xs text-slate-400">
                  Powered by Gemini • Built by Agapitos
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-slate-400">Online</span>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto relative">
        <Scene3DBackground className="opacity-30" />
        <div className="chat-messages max-w-5xl mx-auto px-6 py-8 space-y-6 relative z-10">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  msg.role === "user"
                    ? "bg-brand-500 text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-700"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-brand-100 rounded flex items-center justify-center">
                      <span className="text-brand-600 text-xs font-bold">A</span>
                    </div>
                    <span className="text-xs text-slate-400">Atlas</span>
                  </div>
                )}
                <div className={`prose prose-sm max-w-none ${msg.role === "user" ? "prose-invert" : ""}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <div
                  className={`text-xs mt-2 ${
                    msg.role === "user" ? "text-brand-200" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start chat-message">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-brand-100 rounded flex items-center justify-center">
                    <span className="text-brand-600 text-xs font-bold">A</span>
                  </div>
                  <span className="text-xs text-slate-400">Atlas</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-slate-300 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="chat-input border-t border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex gap-4">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Atlas anything..."
              rows={1}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-brand-500/25"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Atlas AI by Agapitos Kalafatas • Powered by Google Gemini
          </p>
        </div>
      </div>
    </main>
  );
}
