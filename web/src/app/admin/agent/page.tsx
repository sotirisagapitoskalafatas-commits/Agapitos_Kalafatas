"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface StepCall {
  agent: string;
  input: string;
  result: string;
  durationMs: number;
}

interface AgentResult {
  finalAnswer: string;
  steps: StepCall[];
  provider: string;
  model: string;
  requestId: string;
}

interface Msg {
  role: "user" | "agent";
  content: string;
  result?: AgentResult;
  pending?: boolean;
  error?: boolean;
}

function agentAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AgentPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [approvals, setApprovals] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const COMMANDS: Array<{ slug: string; name: string; category: string }> = [
    { slug: "/monday-brief", name: "Monday Brief", category: "Week" },
    { slug: "/friday-brief", name: "Friday Brief", category: "Week" },
    { slug: "/invoice-chase", name: "Invoice Chase", category: "Money" },
    { slug: "/cash-flow-snapshot", name: "Cash Flow Snapshot", category: "Money" },
    { slug: "/lead-triage", name: "Lead Triage", category: "Sales" },
    { slug: "/call-list", name: "Call List", category: "Sales" },
    { slug: "/customer-pulse", name: "Customer Pulse", category: "Customers" },
    { slug: "/handle-complaint", name: "Handle Complaint", category: "Customers" },
    { slug: "/sales-brief", name: "Sales Brief", category: "Sales" },
    { slug: "/content-strategy", name: "Content Strategy", category: "Marketing" },
    { slug: "/review-contract", name: "Review Contract", category: "Paperwork" },
    { slug: "/business-pulse", name: "Business Pulse", category: "Week" },
  ];

  const runQuickCommand = (slug: string) => {
    setInput(slug);
  };

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/approvals", { headers: agentAuthHeaders() });
      if (res.status === 401) {
        if (typeof window !== "undefined") localStorage.removeItem("crm_token");
        setIsLoggedIn(false);
        return;
      }
      const data = await res.json();
      if (data.approvals) setApprovals(data.approvals);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("crm_token")) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("crm_token", data.token);
        setIsLoggedIn(true);
        setLoginError("");
      } else {
        setLoginError(data.error || "Invalid credentials");
      }
    } catch {
      setLoginError("Unable to reach authentication service");
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchApprovals();
  }, [isLoggedIn, fetchApprovals]);

  const decide = async (approvalId: string, decision: "approved" | "rejected") => {
    try {
      await fetch("/api/agent/approvals", {
        method: "POST",
        headers: {
          ...agentAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approvalId, decision, decidedBy: "admin" }),
      });
      fetchApprovals();
    } catch {}
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "agent", content: "", pending: true }]);

    try {
      const isCommand = text.startsWith("/");
      const res = await fetch(isCommand ? "/api/agent/command" : "/api/agent", {
        method: "POST",
        headers: isCommand
          ? { "Content-Type": "application/json", ...agentAuthHeaders() }
          : { "Content-Type": "application/json" },
        body: JSON.stringify(isCommand ? { command: text } : { message: text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "agent",
            content: data.error || "Something went wrong. Please try again.",
            error: true,
          };
          return next;
        });
      } else if (data.command) {
        // Small Business Plugin command endpoint returns { response, staged, ... }
        const cmdResult = data as any;
        const stagedNote =
          cmdResult.staged?.count > 0
            ? `\n\n✍️ ${cmdResult.staged.count} action(s) staged as ${cmdResult.staged.actionType} — pending your approval in the panel. Nothing was sent yet.`
            : "";
        const missingNote =
          cmdResult.connectorsMissing?.length
            ? `\n\n_Note: connectors not yet connected — ${cmdResult.connectorsMissing.join(", ")} (stub data shown)._`
            : "";
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "agent",
            content: cmdResult.response + stagedNote + missingNote,
            result: {
              finalAnswer: cmdResult.response,
              steps: [{ agent: `command:${cmdResult.command}`, input: text, result: cmdResult.response, durationMs: 0 }],
              provider: "plugin",
              model: "stub",
              requestId: cmdResult.requestId || "local",
            },
          };
          return next;
        });
        fetchApprovals();
      } else {
        const result: AgentResult = data;
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "agent",
            content: result.finalAnswer,
            result,
          };
          return next;
        });
      }
    } catch (err: any) {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "agent",
          content: "Network error. Could not reach the agent service.",
          error: true,
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Atlas AI Agent Portal</h1>
            <p className="text-sm text-slate-500 mt-1">Agapitos Kalafatas</p>
          </div>
          <form onSubmit={handleLogin} className="bg-white/70 backdrop-blur-md p-8 rounded-3xl border border-slate-200/80 shadow-2xl space-y-4">
            {loginError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{loginError}</div>}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Username</label>
              <input type="text" required className="w-full p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-900" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Password</label>
              <input type="password" required className="w-full p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-900" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
            </div>
            <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition text-sm">Sign in</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100">
      <div className="flex flex-col md:flex-row h-screen">
        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-white/70 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <div>
                <h1 className="font-bold text-slate-900 leading-tight">Atlas Master AI</h1>
                <p className="text-xs text-slate-500">Multi-agent orchestrator · CRM connected</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowActivity((s) => !s)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              >
                {showActivity ? "Hide Activity" : "Show Activity"}
              </button>
              <a href="/admin/crm" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                Open CRM
              </a>
              <button
                onClick={() => { localStorage.removeItem("crm_token"); setIsLoggedIn(false); }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Suggestions */}
          <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-1">
            {["How many leads are in the CRM?", "What's my sales pipeline value?", "Tell me about e-shop pricing", "Show insurance coverage options", "What is the win rate?"].map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                className="whitespace-nowrap px-3 py-1.5 text-xs bg-white/70 border border-slate-200 rounded-full text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 mt-16">
                <div className="text-5xl mb-3">🤖</div>
                <p className="font-medium text-slate-500">Atlas Master is ready</p>
                <p className="text-sm">Ask me anything about your business, services, or CRM data.</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-md"
                    : m.pending
                    ? "bg-white/70 backdrop-blur-md border border-slate-200 text-slate-500 rounded-bl-md"
                    : m.error
                    ? "bg-red-50 border border-red-200 text-red-700 rounded-bl-md"
                    : "bg-white/70 backdrop-blur-md border border-slate-200 text-slate-800 rounded-bl-md"
                }`}>
                  {m.pending ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      Master is dispatching sub-agents…
                    </span>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}

                  {m.result && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
                      {m.result.steps.map((s, j) => (
                        <div key={j} className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5">
                          <span className="font-medium text-indigo-600">→ {s.agent}</span>
                          <span>{s.durationMs}ms</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {m.result.provider} · {m.result.model}
                        </span>
                        <span className="font-mono text-[10px]">{m.result.requestId.slice(0, 8)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200/70 bg-white/60 backdrop-blur-md p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask Atlas Master… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="flex-1 resize-none p-3 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-900"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
              >
                {loading ? "…" : "Send"}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              The LLM proposes; Postgres &amp; tenant-scoped RPCs authorize. Requests are audited.
            </p>
          </div>
        </div>

        {/* Activity / Registry panel */}
        {showActivity && (
          <aside className="w-full md:w-72 bg-white/50 backdrop-blur-md border-t md:border-t-0 md:border-l border-slate-200/70 overflow-y-auto hidden md:block">
            <div className="p-4">
              {/* Pending Approvals */}
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                Pending Approvals{" "}
                {approvals.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                    {approvals.length}
                  </span>
                )}
              </h2>

              {approvals.length === 0 ? (
                <p className="text-xs text-slate-400 mb-4">No actions awaiting approval.</p>
              ) : (
                <ul className="space-y-2 mb-4">
                  {approvals.map((a) => (
                    <li key={a.id} className="bg-white/80 border border-amber-200 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
                          {a.action_type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{a.idempotency_key.slice(0, 8)}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1">{a.summary}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => decide(a.id, "approved")}
                          className="flex-1 px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => decide(a.id, "rejected")}
                          className="flex-1 px-2 py-1 text-[11px] font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                Small Business Commands{" "}
                <span className="text-[10px] font-normal text-slate-400 normal-case">(tap to run)</span>
              </h2>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {COMMANDS.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => runQuickCommand(c.slug)}
                    className="px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50/60 text-indigo-700 text-[11px] font-semibold hover:bg-indigo-100 transition"
                    title={c.name}
                  >
                    {c.slug}
                  </button>
                ))}
              </div>

              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Agent Registry</h2>
              <ul className="space-y-2">
                {[
                  ["webdev", "Web & Software", "E-shops, SaaS, AI agents"],
                  ["energy", "Energy Services", "Electricity, gas, PV, EV"],
                  ["insurance", "Insurance", "Life, health, car, property"],
                  ["leadcrm", "Lead & CRM", "Leads, deals, pipeline, invoices"],
                  ["analytics", "Business Intel", "Pipeline metrics, forecasts"],
                  ["comms", "Communications", "Email & comm log"],
                  ["tasks", "Tasks", "To-dos & reminders"],
                  ["documents", "Documents", "Client document vault"],
                  ["operations", "Operations", "Adds leads/deals/events"],
                  ["general", "General Knowledge", "Company knowledge base"],
                ].map(([id, name, desc]) => (
                  <li key={id} className="bg-white/80 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-sm text-slate-800">{name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                  </li>
                ))}
              </ul>

              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-6 mb-2">Model Cascade</h2>
              <div className="text-xs text-slate-500 space-y-1">
                <p>1. <b>Router</b> — routes to agent (small)</p>
                <p>2. <b>Specialist</b> — agent runs tools</p>
                <p>3. <b>Tier</b> — complexity &amp; risk gating</p>
                <p className="text-amber-600"><b>Writes</b> — proposed → approved → executed</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
