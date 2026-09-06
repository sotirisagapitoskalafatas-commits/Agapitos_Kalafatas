"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocale } from "@/contexts/LanguageContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: { name: string; agent: string }[];
}

const greetings: Record<string, { title: string; subtitle: string; suggestions: { label: string; query: string }[] }> = {
  el: {
    title: "Πώς μπορώ να σας βοηθήσω;",
    subtitle: "Ρωτήστε με για Eshop, Software, ρεύμα, ή ασφάλειες.",
    suggestions: [
      { label: "Κατασκευή E-shop από 1400€", query: "Tell me about your E-shop packages starting at €1400" },
      { label: "Ασφάλεια Υγείας & Αυτοκινήτου", query: "What insurance options do you offer for health and car?" },
      { label: "Φθηνό Ρεύμα & Αέριο", query: "Can you help me find cheaper electricity and gas plans?" },
      { label: "Custom Software & AI", query: "I need a custom SaaS application or AI agent built" },
    ],
  },
  en: {
    title: "How can I help you?",
    subtitle: "Ask me about Eshops, Software, energy, or insurance.",
    suggestions: [
      { label: "E-shop from €1400", query: "Tell me about your E-shop packages starting at €1400" },
      { label: "Health & Car Insurance", query: "What insurance options do you offer for health and car?" },
      { label: "Cheap Electricity & Gas", query: "Can you help me find cheaper electricity and gas plans?" },
      { label: "Custom Software & AI", query: "I need a custom SaaS application or AI agent built" },
    ],
  },
  fr: {
    title: "Comment puis-je vous aider?",
    subtitle: "Demandez-moi des informations sur les Eshops, logiciels, énergie ou assurances.",
    suggestions: [
      { label: "E-shop à partir de 1400€", query: "Tell me about your E-shop packages starting at €1400" },
      { label: "Assurance Santé & Auto", query: "What insurance options do you offer for health and car?" },
      { label: "Électricité & Gaz pas chers", query: "Can you help me find cheaper electricity and gas plans?" },
      { label: "Logiciel & IA sur mesure", query: "I need a custom SaaS application or AI agent built" },
    ],
  },
};

const WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:8000/ws/agent";

export default function AtlasAgenticWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { locale } = useLocale();

  const lang = locale || "el";
  const g = greetings[lang] || greetings.el;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // WebSocket connection management
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setWsConnected(true);
        console.log("[Atlas WS] connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "agent_stream" && data.content) {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === "assistant" && !last.toolCalls) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + data.content },
                ];
              }
              return [...prev, { role: "assistant", content: data.content }];
            });
          }
          if (data.done) {
            setIsLoading(false);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log("[Atlas WS] disconnected");
      };

      ws.onerror = () => {
        setWsConnected(false);
      };

      wsRef.current = ws;
    } catch {
      setWsConnected(false);
    }
  }, []);

  // Connect on open
  useEffect(() => {
    if (isOpen) connectWs();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [isOpen, connectWs]);

  // Send via WebSocket (preferred) or REST fallback
  const sendViaWs = useCallback(
    (text: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "text_message",
            text,
            history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          })
        );
        return true;
      }
      return false;
    },
    [messages]
  );

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Try WebSocket first
    if (sendViaWs(text.trim())) {
      return;
    }

    // Fallback to REST API
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          locale: lang,
        }),
      });

      const data = await res.json();

      const toolCalls: { name: string; agent: string }[] = [];
      if (data.response?.includes("Agent 1"))
        toolCalls.push({ name: "webDevSubAgent", agent: "Web & Software" });
      if (data.response?.includes("Agent 2"))
        toolCalls.push({ name: "energySubAgent", agent: "Energy Services" });
      if (data.response?.includes("Agent 3"))
        toolCalls.push({ name: "insuranceSubAgent", agent: "Insurance" });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "I could not process that request.",
          toolCalls,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            lang === "el"
              ? "Σφάλμα σύνδεσης. Δοκιμάστε ξανά."
              : lang === "fr"
              ? "Erreur de connexion. Réessayez."
              : "Connection error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Push-to-Talk voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);

        // For now, use browser speech recognition as PTT fallback
        // Full audio pipeline requires server-side faster-whisper
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
          const SpeechRecognition =
            (window as any).webkitSpeechRecognition ||
            (window as any).SpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.lang = lang === "el" ? "el-GR" : lang === "fr" ? "fr-FR" : "en-US";
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) sendMessage(transcript);
          };

          recognition.onerror = () => setIsRecording(false);
          recognition.onend = () => setIsRecording(false);
          recognition.start();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 15 seconds
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 15000);
    } catch {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen && (
        <div className="bg-[#121824] border border-gray-800 text-white w-[380px] sm:w-[420px] h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#1A2234] p-4 border-b border-gray-800 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                ⚡
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">
                  Atlas AI Aggregator
                </h3>
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                    wsConnected ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span className="text-[11px] text-gray-400">
                  {wsConnected ? "WebSocket Active" : "REST Mode"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0B0F17]">
            {messages.length === 0 && (
              <div className="text-center py-10 px-4 text-gray-400 text-xs">
                <div className="w-12 h-12 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center mx-auto mb-3 text-xl text-blue-400">
                  ⚡
                </div>
                <p className="font-semibold text-white mb-1">{g.title}</p>
                <p className="text-gray-400 mb-4">{g.subtitle}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-left">
                  {g.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.query)}
                      className="p-2 bg-[#1A2234] rounded-lg border border-gray-800 hover:border-blue-500 cursor-pointer transition text-left"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-[#1A2234] border border-gray-800 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {m.toolCalls?.map((tc, j) => (
                    <div
                      key={j}
                      className="mb-2 p-2 bg-[#0B0F17] rounded border border-blue-500/30 text-[10px] text-blue-300 flex items-center space-x-2"
                    >
                      <span className="animate-spin">⚙️</span>
                      <span>Sub-Agent: {tc.agent}</span>
                    </div>
                  ))}
                  {m.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1A2234] border border-gray-800 p-3 rounded-2xl text-xs text-blue-400 rounded-bl-none flex items-center space-x-2">
                  <span className="animate-pulse">🧠</span>
                  <span>
                    {lang === "el"
                      ? "Σκέψη & ανάκτηση RAG..."
                      : lang === "fr"
                      ? "Réflexion & récupération RAG..."
                      : "Planning & RAG fetching..."}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 bg-[#1A2234] border-t border-gray-800 flex items-center space-x-2"
          >
            {/* PTT Mic Button */}
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`p-3 rounded-xl transition ${
                isRecording
                  ? "bg-red-500 animate-pulse text-white"
                  : "bg-[#0B0F17] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600"
              }`}
              title="Push to Talk"
            >
              🎤
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                lang === "el"
                  ? "Γράψτε το μήνυμά σας..."
                  : lang === "fr"
                  ? "Écrivez votre message..."
                  : "Type your message..."
              }
              className="flex-1 bg-[#0B0F17] border border-gray-800 text-white text-xs rounded-xl p-3 outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition disabled:opacity-40"
            >
              ➔
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Atlas AI"
          className="ai-chat relative w-[82px] h-[82px] rounded-full shadow-2xl transition-transform"
        >
          <img
            src="/images/ai-chat-icon.png"
            alt="Atlas AI"
            className="ai-icon"
          />
        </button>
      )}
    </div>
  );
}
