// INTCH Sales Diagnostic — deterministic scoring engine.
//
// RULE: all math is deterministic TypeScript, computed server-side. The LLM
// never computes numbers; it only writes narrative and structured hypotheses
// from the numbers this module produces.
//
// Benchmarks are labeled DIRECTIONAL ESTIMATES (ranges, not point values) so
// they read as guidance, never as verified industry facts. The illustrative
// "64% → 1.7× revenue on a 5% close-rate improvement" line stays illustrative.

export type FunnelSnapshot = {
  // Raw funnel counts — the only required inputs.
  leadsTotal: number;
  leadsContacted: number;
  leadsQualified: number;
  leadsCustomer: number;
  dealsOpen: number;
  dealsWon: number;
  dealsLost: number;
  dealsValueOpen: number;
  dealsValueWon: number;
  dealsValueLost: number;
};

export type FunnelRates = {
  contactRate: number | null; // contacted / total
  qualifyRate: number | null; // qualified / contacted
  closeRate: number | null;   // won / (won + lost)
  leadToCustomerRate: number | null; // customers / total
  avgDealSize: number | null; // won value / won count
};

export type Leak = {
  stage: string;           // "contact" | "qualify" | "close" | "volume"
  label: string;
  severity: "low" | "medium" | "high" | "critical";
  yourRate: number | null;
  benchmarkRange: [number, number];
  description: string;
};

export type DiagnosticResult = {
  score: number;                       // 0-100
  grade: string;                       // A–F
  rates: FunnelRates;
  leaks: Leak[];                       // sorted most-severe first
  biggestLeak: Leak | null;
  opportunity: {
    target: string;
    upliftRevenue: number | null;      // greatest opportunity, in EUR
    existingRevenue: number;           // won revenue
    scenarios: { pct: number; label: string; revenue: number | null }[];
  };
  funnel: {
    count: { source: string; value: number; pct: number | null }[];
  };
  warnings: string[];                  // data-quality notes (small sample etc.)
};

// ── Directional estimate benchmark ranges by stage (B2B services) ──────────
// Ratios (0..1); surface as percentages ×100 at the UI / payload edge.
const BENCHMARKS = {
  contact: [0.6, 0.8] as [number, number],
  qualify: [0.5, 0.7] as [number, number],
  close: [0.2, 0.35] as [number, number],
  leadToCustomer: [0.08, 0.2] as [number, number],
};

const pct = (n: number | null): number | null =>
  n === null ? null : Math.round(n * 1000) / 10;

function rate(num: number, den: number): number | null {
  if (den <= 0) return null;
  return num / den;
}

export function computeDiagnostic(s: FunnelSnapshot): DiagnosticResult {
  const rates: FunnelRates = {
    contactRate: rate(s.leadsContacted, s.leadsTotal),
    qualifyRate: rate(s.leadsQualified, s.leadsContacted),
    closeRate: rate(s.dealsWon, s.dealsWon + s.dealsLost),
    leadToCustomerRate: rate(s.leadsCustomer, s.leadsTotal),
    avgDealSize: rate(s.dealsValueWon, s.dealsWon),
  };

  const warnings: string[] = [];
  if (s.dealsWon + s.dealsLost < 5) {
    warnings.push(
      `Πολύ μικρό δείγμα κλεισμένων deals (${s.dealsWon + s.dealsLost}). Η βαθμολογία και τα σημεία διαρροής είναι ενδεικτικά.`
    );
  }
  if (s.leadsTotal < 20) {
    warnings.push(
      `Μικρός αριθμός leads (${s.leadsTotal}). Τα ποσοστά μπορεί να μην είναι αντιπροσωπευτικά.`
    );
  }

  // ── Leak detection: gap between your rate and the top of the benchmark range ──
  const leaks: Leak[] = [];
  const addLeak = (
    key: "contact" | "qualify" | "close" | "volume",
    label: string,
    your: number | null,
    range: [number, number],
    desc: string
  ) => {
    if (your === null) return;
    const EPS = 1e-9;
    const gap = range[1] - your;
    const severity =
      gap + EPS >= 0.3 ? "critical" : gap + EPS >= 0.2 ? "high" : gap + EPS >= 0.1 ? "medium" : "low";
    leaks.push({ stage: key, label, severity, yourRate: your, benchmarkRange: range, description: desc });
  };

  addLeak(
    "contact",
    "Απόκριση / Πρώτη επαφή",
    rates.contactRate,
    BENCHMARKS.contact,
    "Ποσοστό leads που έγιναν έστω διάδικτυα επαφή/qualified — αν χαμηλό, διαρρέετε lead στο πρώτο βήμα."
  );
  addLeak(
    "qualify",
    "Πιστοποίηση (qualified)",
    rates.qualifyRate,
    BENCHMARKS.qualify,
    "Ποσοστό επικοινωνημένων leads που πιστοποιήθηκαν ως σοβαρά — το πιο συχνό σημείο διαρροής."
  );
  addLeak(
    "close",
    "Κλείσιμο πωλήσεων",
    rates.closeRate,
    BENCHMARKS.close,
    "Ποσοστό κλεισμένων deals (won/(won+lost)) — αν χαμηλό, το πρόβλημα είναι η διαπραγμάτευση/πρόταση."
  );
  if (rates.leadToCustomerRate !== null && rates.leadToCustomerRate <= 0.05) {
    leaks.push({
      stage: "volume",
      label: "Όγκος leads",
      severity: "medium",
      yourRate: rates.leadToCustomerRate,
      benchmarkRange: BENCHMARKS.leadToCustomer,
      description: "Εξαιρετικά χαμηλή μετατροπή lead→πελάτης: ενδέχεται να χρειάζεστε ΜΕΓΑΛΥΤΕΡΟ όγκο εισερχόμενων, όχι μόνο καλύτερη διαχείριση.",
    });
  }

  const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
  leaks.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  const biggestLeak = leaks[0] ?? null;

  // ── Score 0-100 (weighted): contact 25, qualify 30, close 30, volume 15 ──
  const scoreOf = (your: number | null, range: [number, number]): number => {
    if (your === null) return 50; // neutral when unknown
    const mid = (range[0] + range[1]) / 2;
    if (your >= range[1]) return 100;
    if (your <= range[0]) return 30;
    // linear between low(=30) and top(=100)
    return 30 + ((your - range[0]) / (range[1] - range[0])) * 70;
  };

  const c = scoreOf(rates.contactRate, BENCHMARKS.contact);
  const q = scoreOf(rates.qualifyRate, BENCHMARKS.qualify);
  const cl = scoreOf(rates.closeRate, BENCHMARKS.close);
  const v = rates.leadToCustomerRate === null
    ? 50
    : scoreOf(rates.leadToCustomerRate, BENCHMARKS.leadToCustomer);

  const score = Math.round(c * 0.25 + q * 0.3 + cl * 0.3 + v * 0.15);
  const grade =
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 45 ? "D" : "F";

  // ── Revenue opportunity (from the biggest leak), with labeled scenarios ──
  const existingRevenue = s.dealsValueWon || 0;
  const upliftRevenue =
    existingRevenue > 0 && biggestLeak && rates.closeRate !== null && biggestLeak.yourRate !== null
      ? // Example: closing the gap on the biggest leak's rate lifts conversion →
        // uplift = existingRevenue * (targetRate - currentRate)/currentRate
        Math.round(existingRevenue * ((biggestLeak.benchmarkRange[1] - biggestLeak.yourRate) / biggestLeak.yourRate))
      : null;

  const scenarios =
    existingRevenue > 0
      ? [5, 10, 15].map((pctImprovement) => ({
          pct: pctImprovement,
          label: `+${pctImprovement}% close rate (illustrative)`,
          revenue: Math.round(existingRevenue * (1 + pctImprovement / 100)),
        }))
      : [];

  const target =
    biggestLeak
      ? `Βελτίωση του «${biggestLeak.label}» από ≈${pct(biggestLeak.yourRate)}% προς το εύρος ${Math.round(biggestLeak.benchmarkRange[1] * 100)}%.`
      : "Καμία μεγάλη διαρροή ανιχνεύθηκε.";

  // ── Funnel breakdown for display ──
  const funnel = {
    count: [
      { source: "Συνολικά leads", value: s.leadsTotal, pct: 100 },
      { source: "Επικοινωνημένα", value: s.leadsContacted, pct: pct(rates.contactRate) },
      { source: "Πιστοποιημένα", value: s.leadsQualified, pct: pct(rates.qualifyRate) },
      { source: "Πελάτες", value: s.leadsCustomer, pct: pct(rates.leadToCustomerRate) },
    ],
  };

  // leaks/biggestLeak surface yourRate as a percentage, matching `rates`.
  // Note: must happen AFTER uplift/target math above, which uses the raw ratio.
  const leaksPct = leaks.map((l) => ({ ...l, yourRate: pct(l.yourRate) }));

  return {
    score,
    grade,
    rates: {
      ...rates,
      contactRate: pct(rates.contactRate),
      qualifyRate: pct(rates.qualifyRate),
      closeRate: pct(rates.closeRate),
      leadToCustomerRate: pct(rates.leadToCustomerRate),
    },
    leaks: leaksPct,
    biggestLeak: leaksPct[0] ?? null,
    opportunity: { target, upliftRevenue, existingRevenue, scenarios },
    funnel,
    warnings,
  };
}