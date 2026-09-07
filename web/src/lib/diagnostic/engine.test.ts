// Regression guard for the ratio-vs-percent class of bugs in the diagnostic engine.
//
// The engine accepts raw ratios internally but must surface *percentages* on
// every field the UI/narrative render as a percent (rates, leaks.yourRate,
// biggestLeak.yourRate), while keeping benchmarkRange raw (UI multiplies ×100).
// Run: npx tsx src/lib/diagnostic/engine.test.ts
import { computeDiagnostic, FunnelSnapshot } from "./engine";

const SAMPLE: FunnelSnapshot = {
  leadsTotal: 100,
  leadsContacted: 50,
  leadsQualified: 20,
  leadsCustomer: 6,
  dealsOpen: 15,
  dealsWon: 4,
  dealsLost: 12,
  dealsValueOpen: 60000,
  dealsValueWon: 40000,
  dealsValueLost: 90000,
};

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const d = computeDiagnostic(SAMPLE);

// rates are percentages
assert(d.rates.contactRate === 50, `rates.contactRate should be 50, got ${d.rates.contactRate}`);
assert(d.rates.qualifyRate === 40, `rates.qualifyRate should be 40, got ${d.rates.qualifyRate}`);
assert(d.rates.closeRate === 25, `rates.closeRate should be 25, got ${d.rates.closeRate}`);
assert(d.rates.leadToCustomerRate === 6, `leadToCustomerRate should be 6, got ${d.rates.leadToCustomerRate}`);

// leak rates are percentages too (the bug: they were raw ratios surfaced as-is)
// A surfaced % is 0 or in (1, 100]; a raw ratio is always in [0, 1].
for (const l of d.leaks) {
  assert(
    l.yourRate === null || l.yourRate === 0 || (l.yourRate > 1 && l.yourRate <= 100),
    `leak "${l.label}" yourRate should be a %, got ${l.yourRate}`
  );
}
const contactLeak = d.leaks.find((l) => l.stage === "contact")!;
assert(contactLeak.yourRate === 50, `contact leak yourRate should be 50, got ${contactLeak.yourRate}`);
assert(
  contactLeak.benchmarkRange[0] === 0.6 && contactLeak.benchmarkRange[1] === 0.8,
  "benchmarkRange must stay raw ratios for UI ×100 rendering"
);

// biggestLeak mirrors the highest-severity leak's already-percent yourRate
const bl = d.biggestLeak;
if (!bl) throw new Error("FAIL: biggestLeak should exist");
assert(bl.yourRate === d.leaks[0].yourRate, "biggestLeak.yourRate should match leaks[0]");

// revenue math still uses the raw ratio underneath and lands correctly
assert(d.opportunity.existingRevenue === 40000, "existingRevenue should be 40000");
// uplifts were computed over the raw ratio, then unchanged by the % surface fix
assert(
  d.opportunity.upliftRevenue === 24000,
  `uplift should be 24000, got ${d.opportunity.upliftRevenue}`
);

console.log("engine.test.ts: all assertions passed");