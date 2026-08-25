"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useLocale } from "@/contexts/LanguageContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const langNames: Record<string, string> = { en: "English", el: "Greek", fr: "French" };

export default function AIChatWidget() {
  const { locale, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prevLocale, setPrevLocale] = useState(locale);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize greeting and update on language change
  useEffect(() => {
    if (locale !== prevLocale) {
      setPrevLocale(locale);
      setMessages((prev) => {
        if (prev.length === 0) {
          return [{ id: "1", role: "assistant", content: t.chat.greeting, timestamp: new Date() }];
        }
        // Update existing greeting message
        return prev.map((msg, i) =>
          i === 0 && msg.role === "assistant" ? { ...msg, content: t.chat.greeting } : msg
        );
      });
    } else if (messages.length === 0) {
      setMessages([{ id: "1", role: "assistant", content: t.chat.greeting, timestamp: new Date() }]);
    }
  }, [locale, t, prevLocale, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
          locale,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || t.chat.error,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.lead) {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data.lead),
        });
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t.chat.error,
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
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? "bg-slate-800 hover:bg-slate-700 rotate-0"
            : "bg-brand-500 hover:bg-brand-600 glow pulse-glow"
        }`}
        style={{ animation: isOpen ? "none" : "pulseGlow 3s ease-in-out infinite" }}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] glass-strong rounded-2xl shadow-2xl border border-slate-200/50 flex flex-col overflow-hidden">
          <div className="bg-brand-500 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">{t.widget.title}</h3>
                <p className="text-brand-100 text-xs">{t.widget.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              <span className="text-brand-100 text-xs">{t.chat.online}</span>
            </div>
          </div>

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
                      <span className="text-[10px] text-slate-400">{t.chat.atlas}</span>
                    </div>
                  )}
                  <div className={`prose prose-sm max-w-none ${msg.role === "user" ? "prose-invert" : ""}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
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

          <div className="border-t border-slate-200/50 p-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.widget.placeholder}
                rows={1}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-slate-300 mt-1.5 text-center">
              {t.chat.poweredBy}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
