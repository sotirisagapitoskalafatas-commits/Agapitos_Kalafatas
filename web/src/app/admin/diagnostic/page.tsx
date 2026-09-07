"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FunnelRates {
  contactRate: number | null;
  qualifyRate: number | null;
  closeRate: number | null;
  leadToCustomerRate: number | null;
  avgDealSize: number | null;
}

interface Leak {
  stage: string;
  label: string;
  severity: "low" | "medium" | "high" | "critical";
  yourRate: number | null;
  benchmarkRange: [number, number];
  description: string;
}

interface Opportunity {
  target: string;
  upliftRevenue: number | null;
  existingRevenue: number;
  scenarios: { pct: number; label: string; revenue: number | null }[];
}

interface Diagnostics {
  score: number;
  grade: string;
  rates: FunnelRates;
  leaks: Leak[];
  biggestLeak: Leak | null;
  opportunity: Opportunity;
  funnel: { count: { source: string; value: number; pct: number | null }[] };
  warnings: string[];
}

interface Hypothesis {
  id: number;
  title: string;
  priority: "p0" | "p1" | "p2";
  impact: number;
  confidence: number;
  ease: number;
  cost: number;
  risk: number;
  score: number;
  stage: string;
  metric: string;
  direction: "up" | "down";
  duration: string;
  owner: string;
  successThreshold: string;
  problem: string;
  hypothesis: string;
  experiment: string;
}

interface DiagnosticResponse {
  generatedAt: string;
  diagnostics: Diagnostics;
  hypotheses: Hypothesis[];
  narrative: string | null;
  dataNotes: string[];
}

const gradeColor: Record<string, string> = {
  A: "text-emerald-600 bg-emerald-50 border-emerald-200",
  B: "text-lime-600 bg-lime-50 border-lime-200",
  C: "text-amber-600 bg-amber-50 border-amber-200",
  D: "text-orange-600 bg-orange-50 border-orange-200",
  F: "text-rose-600 bg-rose-50 border-rose-200",
};

const severityColor: Record<Leak["severity"], string> = {
  critical: "bg-rose-100 text-rose-700 border-rose-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const priorityBadge: Record<Hypothesis["priority"], string> = {
  p0: "bg-rose-100 text-rose-700 border-rose-200",
  p1: "bg-amber-100 text-amber-700 border-amber-200",
  p2: "bg-slate-100 text-slate-600 border-slate-200",
};

const fmtEuro = (n: number | null) =>
  n === null ? "—" : `€${n.toLocaleString("el-GR", { maximumFractionDigits: 0 })}`;

const fmtRate = (r: number | null) => (r === null ? "—" : `${r}%`);

export default function DiagnosticPage() {
  const [data, setData] = useState<DiagnosticResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiagnostic(false);
  }, []);

  async function fetchDiagnostic(narrative: boolean) {
    setLoading(true);
    setError(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`/api/diagnostic${narrative ? "?narrative=1" : ""}`, { headers });
      if (!res.ok) {
        setError(`Αποτυχία λήψης διάγνωσης (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError("Σφάλμα δικτύου. Δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm max-w-md">
          <h1 className="text-xl font-bold text-slate-900">Διάγνωση πωλήσεων</h1>
          <p className="text-sm text-slate-500 mt-2">{error ?? "Δεν υπάρχουν δεδομένα."}</p>
          <button
            onClick={() => fetchDiagnostic(false)}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Επανάληψη
          </button>
        </div>
      </main>
    );
  }

  const { diagnostics: d, hypotheses, narrative, dataNotes } = data;
  const scoreColor =
    d.score >= 75 ? "text-emerald-600" : d.score >= 60 ? "text-amber-600" : "text-rose-600";

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Διάγνωση πωλήσεων</h1>
            <p className="text-sm text-slate-500 mt-1">
              Αξιολόγηση funnel · Σημεία διαρροής · Προτεραιότητες βελτίωσης
            </p>
          </div>
          <Link
            href="/admin/crm"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            ← Back to CRM
          </Link>
        </div>

        {/* Score + Executive section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
            <p className="text-sm text-slate-500">Συνολική βαθμολογία</p>
            <p className={`text-6xl font-black mt-2 ${scoreColor}`}>{d.score}</p>
            <span
              className={`mt-3 px-3 py-1 rounded-lg border font-bold text-lg ${gradeColor[d.grade] ?? gradeColor.F}`}
            >
              {d.grade}
            </span>
          </div>

          {/* Biggest leak / opportunity summary */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Κύριο σημείο διαρροής</h3>
            {d.biggestLeak ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold uppercase ${severityColor[d.biggestLeak.severity]}`}>
                    {d.biggestLeak.severity}
                  </span>
                  <span className="font-semibold text-slate-800">{d.biggestLeak.label}</span>
                </div>
                <p className="text-sm text-slate-600">
                  Το ποσοστό σας: <b>{fmtRate(d.biggestLeak.yourRate)}</b> έναντι{" "}
                  {Math.round(d.biggestLeak.benchmarkRange[0] * 100)}–{Math.round(d.biggestLeak.benchmarkRange[1] * 100)}%
                  (κατευθυντική εκτίμηση).
                </p>
                <p className="text-sm text-slate-500">{d.biggestLeak.description}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Καμία μεγάλη διαρροή ανιχνεύθηκε.</p>
            )}
            <p className="text-xs text-slate-400 mt-2">{d.opportunity.target}</p>
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Funnel</h3>
          <div className="space-y-3">
            {d.funnel.count.map((row, i) => (
              <div key={row.source}>
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>{row.source}</span>
                  <span>
                    <b>{row.value}</b> {row.pct !== null && row.pct !== undefined ? `· ${row.pct}%` : ""}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all"
                    style={{ width: `${Math.max(4, Math.min(100, (row.value / Math.max(1, d.funnel.count[0]?.value || 1)) * 100))}%` }}
                  />
                </div>
                {i === 0 && <div className="sr-only">Scale reference</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Rates grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Πρώτη επαφή (contact)", value: fmtRate(d.rates.contactRate) },
            { label: "Qualification", value: fmtRate(d.rates.qualifyRate) },
            { label: "Κλείσιμο (close)", value: fmtRate(d.rates.closeRate) },
            { label: "Lead → πελάτης", value: fmtRate(d.rates.leadToCustomerRate) },
            { label: "Μέσο deal", value: fmtEuro(d.rates.avgDealSize) },
          ].map((c) => (
            <div key={c.label} className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <p className="text-xl font-bold text-slate-900">{c.value}</p>
              <p className="text-xs text-slate-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Leaks */}
        <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Σημεία διαρροής</h3>
          {d.leaks.length === 0 ? (
            <p className="text-sm text-slate-400">Δεν ανιχνεύθηκαν σημαντικά σημεία διαρροής.</p>
          ) : (
            <div className="space-y-4">
              {d.leaks.map((l) => (
                <div key={l.stage} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold uppercase ${severityColor[l.severity]}`}>
                        {l.severity}
                      </span>
                      <span className="font-semibold text-slate-800">{l.label}</span>
                    </div>
                    <span className="text-sm whitespace-nowrap">
                      <b>{fmtRate(l.yourRate)}</b>
                      <span className="text-slate-400">
                        {" "}vs {Math.round(l.benchmarkRange[0] * 100)}–{Math.round(l.benchmarkRange[1] * 100)}%
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{l.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Executive summary (LLM narrative, optional) */}
        <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700">Σύνοψη (Exec)</h3>
            {!narrative && (
              <button
                onClick={() => fetchDiagnostic(true)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Δημιουργία σύνοψης με AI
              </button>
            )}
          </div>
          {narrative ? (
            <p className="text-sm text-slate-700 leading-relaxed">{narrative}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">
              Δεν έχει δημιουργηθεί ακόμα· πατήστε «Δημιουργία σύνοψης με AI» (προαιρετικό, βασίζεται μόνο στα
              ήδη υπολογισμένα στοιχεία).
            </p>
          )}
        </div>

        {/* Opportunity */}
        <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Ευκαιρία εσόδων</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-2xl font-bold text-slate-900">{fmtEuro(d.opportunity.existingRevenue)}</p>
              <p className="text-xs text-slate-500 mt-1">Υπάρχοντα έσοδα (closed won)</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-2xl font-bold text-indigo-600">{fmtEuro(d.opportunity.upliftRevenue)}</p>
              <p className="text-xs text-slate-500 mt-1">Δυνητικό κέρδος (κλείσιμο χάσματος)</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-2xl font-bold text-slate-900">{fmtEuro((d.opportunity.existingRevenue + (d.opportunity.upliftRevenue ?? 0)) || null)}</p>
              <p className="text-xs text-slate-500 mt-1">Ενδεικτικό σύνολο</p>
            </div>
          </div>
          {d.opportunity.scenarios.length > 0 && (
            <div className="space-y-2">
              {d.opportunity.scenarios.map((s) => (
                <div key={s.pct} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{s.label}</span>
                  <b className="text-slate-800">{fmtEuro(s.revenue)}</b>
                </div>
              ))}
            </div>
          )}
          {d.opportunity.upliftRevenue === null && (
            <p className="text-xs text-slate-400 mt-2">
              Η εκτίμηση κέρδους χρειάζεται τουλάχιστον ένα κλεισμένο deal και έγκυρο ποσοστό close rate.
            </p>
          )}
        </div>

        {/* Hypotheses */}
        <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-1">Υποθέσεις βελτίωσης</h3>
          <p className="text-xs text-slate-400 mb-4">Ιεραρχημένες με impact × confidence × ease ÷ cost ÷ risk.</p>
          <div className="space-y-4">
            {hypotheses.map((h) => (
              <div key={h.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase ${priorityBadge[h.priority]}`}>
                        {h.priority}
                      </span>
                      <span className="font-semibold text-slate-800">{h.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Στάδιο: {h.stage} · KPI: {h.metric} ({h.direction === "up" ? "↑" : "↓"}) · Διάρκεια: {h.duration} · Υπεύθυνος: {h.owner}
                    </p>
                    <p className="text-xs text-slate-500 mt-2"><b>Πρόβλημα:</b> {h.problem}</p>
                    <p className="text-xs text-slate-600 mt-1"><b>Υπόθεση:</b> {h.hypothesis}</p>
                    <p className="text-xs text-slate-600 mt-1"><b>Πείραμα:</b> {h.experiment}</p>
                    <p className="text-xs text-emerald-700 mt-1"><b>Στόχος επιτυχίας:</b> {h.successThreshold}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-black text-slate-800">{h.score.toFixed(1)}</p>
                    <p className="text-[10px] text-slate-400">score</p>
                    <div className="mt-2 flex flex-col gap-0.5 text-[10px] text-slate-500 text-right">
                      <span>impact {h.impact}/5</span>
                      <span>conf {h.confidence}/5</span>
                      <span>ease {h.ease}/5</span>
                      <span>cost {h.cost}/5</span>
                      <span>risk {h.risk}/5</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white/50 border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Σημειώσεις δεδομένων</h3>
          <ul className="list-disc list-inside space-y-1">
            {dataNotes.map((n, i) => (
              <li key={i} className="text-xs text-slate-500">{n}</li>
            ))}
          </ul>
          {d.warnings.length > 0 && (
            <ul className="list-disc list-inside mt-2 space-y-1">
              {d.warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-600">{w}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}