"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Experiment,
  Job,
  LedgerTransaction,
  MemoryRecord,
  Opportunity,
  Proposal,
  Strategy,
  SurvivalState,
  SurvivorAgent,
  WalletView,
} from "@/lib/survivor/types";

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

interface DashboardPayload {
  agent: SurvivorAgent | null;
  wallet: WalletView;
  survival: SurvivalState;
  transactions: LedgerTransaction[];
  opportunities: Opportunity[];
  proposals: Proposal[];
  jobs: Job[];
  strategy: Strategy | null;
  memory: MemoryRecord[];
  experiments: Experiment[];
  config: { mode: string; startingCapital: number; maxSingleExpense: number; maxDailyExpense: number; maxRiskPercent: number; minRunway: number; bidsPerRun: number };
  error?: string;
}

const STATUS_CHIP: Record<string, string> = {
  alive: "bg-green-100 text-green-700 border-green-200",
  hybernating: "bg-amber-100 text-amber-700 border-amber-200",
  dead: "bg-rose-100 text-rose-700 border-rose-200",
};

const CURRENCY = (n: number) =>
  `€${n.toLocaleString("el-GR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatusPill({ status }: { status: SurvivalState }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${STATUS_CHIP[status] || STATUS_CHIP.alive}`}>
      {status.toUpperCase()}
    </span>
  );
}

function BrainLoader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-indigo-600">
      <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
      <span>{label}</span>
    </div>
  );
}

function CardList<T>({ items, render, empty }: { items: T[]; render: (item: T) => React.ReactNode; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-slate-400 italic">{empty}</p>;
  return <ul className="divide-y divide-slate-100">{items.map((item, i) => (
    <li key={i} className="py-2">{render(item)}</li>
  ))}</ul>;
}

export default function SurvivorView() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/survivor/dashboard", { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to load");
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runExperiment = async () => {
    setBusy(true); setNotice(null);
    try {
      const res = await fetch("/api/survivor/run", { method: "POST", headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to start experiment");
      setNotice(`Experiment started: ${json.plan.bidsStaged} bid(s) staged for admin approval.`);
    } catch (e: any) {
      setNotice(`⚠️ ${e.message}`);
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const simulate = async () => {
    setBusy(true); setNotice(null);
    try {
      const res = await fetch("/api/survivor/simulate", { method: "POST", headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Simulation failed");
      setNotice(`Simulation tick: ${json.advanced} job(s) advanced, ${json.payments} paid (+${CURRENCY(json.credits)}).`);
    } catch (e: any) {
      setNotice(`⚠️ ${e.message}`);
    } finally {
      setBusy(false);
      refresh();
    }
  };

  if (error && !data) {
    return (
      <div className="crm-card-3d rounded-2xl p-8 border border-rose-200 bg-rose-50/60">
        <p className="text-rose-700 font-semibold">Could not load AI Survivor.</p>
        <p className="text-sm text-rose-500 mt-1">{error}</p>
        <button onClick={refresh} className="mt-4 text-sm font-medium text-indigo-600 hover:underline">Retry</button>
      </div>
    );
  }

  if (!data) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;
  }

  const { wallet, survival, transactions, opportunities, proposals, jobs, strategy, memory, experiments, config } = data;
  const showEmpty = transactions.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header + actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="atlas-plex text-lg font-semibold" style={{ color: "var(--cc-ink)" }}>
              AI Freelance Survivor
            </h3>
            <StatusPill status={survival} />
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--cc-muted)" }}>
            Mode: <b>{config.mode}</b> · Starting capital {CURRENCY(config.startingCapital)} · Max single expense {CURRENCY(config.maxSingleExpense)} · Daily cap {CURRENCY(config.maxDailyExpense)} · Risk cap {config.maxRiskPercent}%
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runExperiment}
            disabled={busy || survival === "dead"}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-opacity disabled:opacity-50"
            style={{ background: "var(--cc-indigo-bg)", color: "var(--cc-indigo-ink)" }}
          >
            ▶ Run Experiment
          </button>
          <button
            onClick={simulate}
            disabled={busy || survival === "dead"}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-opacity disabled:opacity-50 border border-slate-300 bg-white/70 text-slate-700 hover:bg-white"
          >
            ⚙ Simulate Jobs
          </button>
          <button onClick={refresh} className="text-sm font-semibold px-4 py-2 rounded-xl border border-slate-300 bg-white/70 text-slate-700 hover:bg-white transition-opacity">
            ↻ Refresh
          </button>
        </div>
      </div>

      {busy && <BrainLoader label="Waiting for the survivor brain…" />}
      {notice && (
        <div className="text-sm rounded-xl px-4 py-3 border" style={{
          background: "var(--cc-indigo-bg)", color: "var(--cc-indigo-ink)", borderColor: "transparent",
        }}>{notice}</div>
      )}

      {showEmpty ? (
        <div className="crm-card-3d rounded-2xl p-10 text-center border border-dashed border-slate-300">
          <div className="text-4xl mb-3">🌱</div>
          <h4 className="font-semibold" style={{ color: "var(--cc-ink)" }}>The Survivor is frozen.</h4>
          <p className="text-sm mt-1" style={{ color: "var(--cc-muted)" }}>
            No agent initialized yet. Run an experiment to seed the sandbox wallet with starting capital and let the brain scout opportunities.
          </p>
          <button
            onClick={runExperiment}
            disabled={busy}
            className="mt-4 text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50"
            style={{ background: "var(--cc-indigo-bg)", color: "var(--cc-indigo-ink)" }}
          >
            ▶ Start first experiment
          </button>
        </div>
      ) : (
        <>
          {/* Wallet */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <WalletCard label="Cash balance" value={CURRENCY(wallet.balance)} tone="indigo" />
            <WalletCard label="Pending bids" value={CURRENCY(wallet.pendingBids)} tone="amber" note="awaiting approval" />
            <WalletCard label="Reserved (won jobs)" value={CURRENCY(wallet.reserved)} tone="cyan" note="in flight" />
            <WalletCard label="Survival" value={survival} tone="green" note={`strategy: ${strategy?.profile || "—"}`} />
          </div>

          {/* Strategy weights */}
          {strategy && (
            <div className="crm-card-3d rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold" style={{ color: "var(--cc-ink)" }}>Active strategy: {strategy.profile}</h4>
                <span className="text-xs text-slate-400">weights update from postmortem learning</span>
              </div>
              <div className="flex flex-wrap gap-3">
{[
                    ["Value", strategy.params.valueWeight],
                    ["Deadline", strategy.params.deadlineWeight],
                    ["Complexity", strategy.params.complexityWeight],
                    ["Risk tolerance", strategy.params.riskTolerance],
                    ["Min score", strategy.params.minScore / 100],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex-1 min-w-[120px]">
                      <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{String(label)}</span><span className="font-medium">{value}</span></div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value as number) * 100)}%`, backgroundColor: "#0d9488" }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ledger */}
            <div className="crm-card-3d rounded-2xl p-5 border border-slate-200">
              <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--cc-ink)" }}>Ledger (immutable)</h4>
              <CardList items={transactions.slice(0, 10)} render={(tx) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                    <p className="text-[11px] text-slate-400">{new Date(tx.created_at).toLocaleString("el-GR")} · {tx.reference_id.slice(0, 24)}…</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-semibold ${tx.amount > 0 ? "text-green-600" : "text-rose-600"}`}>
                      {tx.amount > 0 ? "+" : ""}{CURRENCY(tx.amount)}
                    </span>
                    <p className="text-[11px] text-slate-400">bal {CURRENCY(tx.balance_after)}</p>
                  </div>
                </div>
              )} empty="No ledger entries yet." />
            </div>

            {/* Proposals */}
            <div className="crm-card-3d rounded-2xl p-5 border border-slate-200">
              <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--cc-ink)" }}>Proposals ({proposals.filter((p) => p.decision === "bid").length} bids)</h4>
              <CardList items={proposals.slice(0, 10)} render={(p) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">Score {p.score} · {p.status}</p>
                    <p className="text-[11px] text-slate-400">{p.rationale || "—"}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${p.decision === "bid" ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {p.decision.toUpperCase()}
                  </span>
                </div>
              )} empty="No proposals yet. Run an experiment." />
            </div>

            {/* Jobs */}
            <div className="crm-card-3d rounded-2xl p-5 border border-slate-200">
              <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--cc-ink)" }}>Job pipeline</h4>
              <CardList items={jobs.slice(0, 10)} render={(j) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{j.title}</p>
                    <p className="text-[11px] text-slate-400">{j.client || "sandbox"} · win-rate {j.win_rate}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold" style={{ color: "var(--cc-ink)" }}>{CURRENCY(j.value)}</span>
                    <p className="text-[11px] text-slate-400">{j.status}</p>
                  </div>
                </div>
              )} empty="No jobs yet. Approve a proposal in the JARVIS panel, then Simulate Jobs." />
            </div>

            {/* Memory */}
            <div className="crm-card-3d rounded-2xl p-5 border border-slate-200">
              <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--cc-ink)" }}>Memory & lessons</h4>
              <CardList items={memory.slice(0, 10)} render={(m) => (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-600">{m.content}</p>
                    <p className="text-[11px] text-slate-400">{m.kind} · conf {m.confidence}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{new Date(m.created_at).toLocaleDateString("el-GR")}</span>
                </div>
              )} empty="No lessons yet. The survivor learns from each job outcome." />
            </div>
          </div>

          {/* Experiments */}
          <div className="crm-card-3d rounded-2xl p-5 border border-slate-200">
            <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--cc-ink)" }}>Experiments</h4>
            <CardList items={experiments.slice(0, 10)} render={(ex) => (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{ex.name}</p>
                  <p className="text-[11px] text-slate-400">{ex.summary || "—"}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${ex.status === "running" ? "bg-green-50 text-green-600 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                  {ex.status.toUpperCase()}
                </span>
              </div>
            )} empty="No experiments yet." />
          </div>
        </>
      )}
    </div>
  );
}

function WalletCard({ label, value, tone, note }: { label: string; value: string; tone: "indigo" | "amber" | "cyan" | "green"; note?: string }) {
  const accent: Record<string, string> = {
    indigo: "#2f5fd8",
    amber: "#b45309",
    cyan: "#0e7490",
    green: "#15803d",
  };
  return (
    <div className="crm-card-3d rounded-2xl p-4 border border-slate-200">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color: accent[tone] }}>{value}</p>
      {note && <p className="text-[11px] text-slate-400 mt-0.5">{note}</p>}
    </div>
  );
}