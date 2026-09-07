import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { computeDiagnostic, FunnelSnapshot } from "@/lib/diagnostic/engine";
import { buildHypotheses } from "@/lib/diagnostic/hypotheses";
import { getModelClient } from "@/lib/agents/model-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Statuses that represent "real" tracked leads (archived = noise, excluded).
const CONTACTED = ["contacted", "qualified", "customer"];
const QUALIFIED = ["qualified", "customer"];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return unauthorizedResponse();

  const [leadsRes, dealsRes] = await Promise.all([
    supabase.from("leads").select("id, status"),
    supabase.from("deals").select("id, stage, value"),
  ]);

  if (leadsRes.error || dealsRes.error) {
    return NextResponse.json(
      { error: "Failed to read CRM data" },
      { status: 502 }
    );
  }

  const leads = leadsRes.data || [];
  const deals = dealsRes.data || [];

  const value = (d: { value: number | null }) => Number(d.value || 0);
  const leadsTotal = leads.filter((l) => l.status !== "archived").length;
  const leadsContacted = leads.filter((l) => CONTACTED.includes(l.status)).length;
  const leadsQualified = leads.filter((l) => QUALIFIED.includes(l.status)).length;
  const leadsCustomer = leads.filter((l) => l.status === "customer").length;

  const openStages = ["lead", "qualified", "proposal", "negotiation"];
  const dealsWon = deals.filter((d) => d.stage === "closed_won");
  const dealsLost = deals.filter((d) => d.stage === "closed_lost");
  const dealsOpen = deals.filter((d) => openStages.includes(d.stage));

  const snapshot: FunnelSnapshot = {
    leadsTotal,
    leadsContacted,
    leadsQualified,
    leadsCustomer,
    dealsOpen: dealsOpen.length,
    dealsWon: dealsWon.length,
    dealsLost: dealsLost.length,
    dealsValueOpen: dealsOpen.reduce((s, d) => s + value(d), 0),
    dealsValueWon: dealsWon.reduce((s, d) => s + value(d), 0),
    dealsValueLost: dealsLost.reduce((s, d) => s + value(d), 0),
  };

  const diagnostics = computeDiagnostic(snapshot);
  const hypotheses = buildHypotheses(diagnostics);

  // Narrative is the ONLY LLM-authored field. It receives precomputed numbers
  // and is strictly forbidden from recomputing/inventing any of them. A failure
  // or missing API key degrades gracefully to `narrative: null`.
  let narrative: string | null = null;
  if (req.nextUrl.searchParams.get("narrative") === "1") {
    narrative = await generateNarrative(diagnostics);
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    snapshot,
    diagnostics,
    hypotheses,
    narrative,
    dataNotes: [
      "Τα leads με status 'archived' εξαιρούνται (θεωρούνται θόρυβος/ανενεργά).",
      "Contact rate = επικοινωνημένα / σύνολο · Qualify rate = πιστοποιημένα / επικοινωνημένα · Close rate = κερδισμένα / (κερδισμένα+χαμένα).",
      "Τα σημεία σύγκρισης (benchmarks) είναι κατευθυντικές εκτιμήσεις (εύρη) B2B υπηρεσιών, όχι επιβεβαιωμένα κλάδικά στοιχεία.",
    ],
  });
}

async function generateNarrative(
  diagnostics: Awaited<ReturnType<typeof computeDiagnostic>>
): Promise<string | null> {
  const client = getModelClient("small");
  const summary = {
    score: diagnostics.score,
    grade: diagnostics.grade,
    rates: diagnostics.rates,
    leaks: diagnostics.leaks.map((l) => ({
      label: l.label,
      severity: l.severity,
      yourRate: l.yourRate,
      benchmarkRange: l.benchmarkRange,
    })),
    biggestLeak: diagnostics.biggestLeak?.label ?? null,
    existingRevenue: diagnostics.opportunity.existingRevenue,
    warnings: diagnostics.warnings,
  };

  try {
    const res = await client.chat(
      [
        {
          role: "system",
          content: [
            "You are the INTCH sales diagnostic narrative writer.",
            "You are given PRE-COMPUTED funnel metrics (already server-side).",
            "You write ONLY 3-5 sentences of executive narrative prose, in Greek.",
            "RULES:",
            "- Never recompute, change, or invent any number. Use the provided numbers verbatim.",
            "- Never present benchmark ranges as verified industry facts; call them 'κατευθυντικές εκτιμήσεις' (directional estimates).",
            "- Reference the biggest leak and the concrete opportunity if present.",
            "- Tone: concise, actionable, like a senior sales advisor. No headings, no bullets, plain prose.",
          ].join("\n"),
        },
        {
          role: "user",
          content: JSON.stringify(summary, null, 2),
        },
      ],
      []
    );
    if (!res.content) return null;
    return res.content.trim();
  } catch {
    return null;
  }
}