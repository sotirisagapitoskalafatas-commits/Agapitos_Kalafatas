"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

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
    <main className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-dark-400 hover:text-white transition-colors"
            >
              ← Home
            </Link>
            <div className="w-px h-6 bg-dark-700" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="text-white font-semibold">Atlas AI</h1>
                <p className="text-xs text-dark-400">
                  Powered by Gemini • Built by Agapitos
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-dark-400">Online</span>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
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
                    : "bg-dark-800 border border-dark-700 text-dark-100"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 bg-brand-500/20 rounded flex items-center justify-center">
                      <span className="text-brand-400 text-xs font-bold">
                        A
                      </span>
                    </div>
                    <span className="text-xs text-dark-400">Atlas</span>
                  </div>
                )}
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                <div
                  className={`text-xs mt-2 ${
                    msg.role === "user" ? "text-brand-200" : "text-dark-500"
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
              <div className="bg-dark-800 border border-dark-700 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-brand-500/20 rounded flex items-center justify-center">
                    <span className="text-brand-400 text-xs font-bold">A</span>
                  </div>
                  <span className="text-xs text-dark-400">Atlas</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-dark-400 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-dark-400 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-dark-400 rounded-full typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-dark-800 bg-dark-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex gap-4">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Atlas anything..."
              rows={1}
              className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-400 resize-none focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-dark-500 mt-2 text-center">
            Atlas AI by Agapitos Kalafatas • Powered by Google Gemini
          </p>
        </div>
      </div>
    </main>
  );
}
