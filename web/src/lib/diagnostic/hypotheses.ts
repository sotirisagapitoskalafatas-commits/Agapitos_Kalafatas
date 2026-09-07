// 10-hypotheses engine for the INTCH Sales Diagnostic.
//
// The STRUCTURED FIELDS of each hypothesis are deterministic (templated from
// the detected leak + the user's numbers). The LLM writes only the narrative
// fields (problem / hypothesis / experiment prose) on top of these.
import type { DiagnosticResult } from "./engine";

export type Hypothesis = {
  id: number;
  title: string;
  priority: "p0" | "p1" | "p2";
  impact: number;   // 1-5
  confidence: number; // 1-5
  ease: number;     // 1-5 (higher = easier)
  cost: number;     // 1-5 (higher = costlier)
  risk: number;     // 1-5 (higher = riskier)
  score: number;    // impact * confidence * ease / cost / risk, normalized
  stage: string;    // the funnel stage it targets
  metric: string;   // the KPI it should move
  direction: "up" | "down";
  duration: string; // est. weeks
  owner: string;    // suggested owner
  successThreshold: string;
  problem: string;
  hypothesis: string;
  experiment: string;
};

// Ranking: impact × confidence × ease ÷ cost ÷ risk. Higher = prioritize first.
function rank(h: Omit<Hypothesis, "score" | "priority">): Hypothesis {
  const raw = (h.impact * h.confidence * h.ease) / Math.max(1, h.cost * h.risk);
  const score = Math.round(raw * 10) / 10;
  const priority = raw >= 6 ? "p0" : raw >= 3 ? "p1" : "p2";
  return { ...h, score, priority };
}

export function buildHypotheses(diag: DiagnosticResult): Hypothesis[] {
  const leak = diag.biggestLeak;
  const leakStage = leak?.stage ?? "volume";
  const avgRaw = diag.rates.avgDealSize ?? 0;
  const closePct = diag.rates.closeRate ?? null;
  const fmtEuro = (n: number) => `€${n.toLocaleString("el-GR")}`;

  const h: Omit<Hypothesis, "score" | "priority">[] = [
    {
      id: 1,
      title: "Απάντηση στα leads εντός 5 λεπτών (speed-to-lead)",
      impact: 5, confidence: 4, ease: 5, cost: 1, risk: 1,
      stage: "contact",
      metric: "contact_rate",
      direction: "up",
      duration: "2-3 εβδ.",
      owner: "Πωλητής / ο ίδιος",
      successThreshold: "contact_rate +15 p.p. ή >70%",
      problem: "Τα leads που έχουν δεδομένο σημείο επαφής δεν γίνονται σωστά πρώτη επαφή.",
      hypothesis: "Αν απαντήσουμε στα εισερχόμενα leads εντός 5 λεπτών, σημαντικά περισσότερα θα περάσουν σε πρώτη επαφή.",
      experiment: "Για 4 εβδομάδες: άμεση τηλεφωνική/WhatsApp απάντηση σε κάθε νέο lead εντός 5', καταγραφή αποτελέσματος (επαφή/όχι).",
    },
    {
      id: 2,
      title: "Τυπικό ερωτηματολόγιο qualification (BPNT)",
      impact: 5, confidence: 4, ease: 4, cost: 1, risk: 1,
      stage: "qualify",
      metric: "qualify_rate",
      direction: "up",
      duration: "3-4 εβδ.",
      owner: "Πωλητής / ο ίδιος",
      successThreshold: "qualify_rate +10 p.p.",
      problem: "Τα επικοινωνημένα leads δεν πιστοποιούνται με συνέπεια (Budget/Need/Plan/Timing).",
      hypothesis: "Δομημένη ερώτηση qualification σε κάθε κλήση θα αυξήσει το ποσοστό σοβαρών ευκαιριών.",
      experiment: "Εφαρμογή checklist BPNT σε 20 κλήσεις. Μέτρηση: % που χαρακτηρίζονται qualified.",
    },
    {
      id: 3,
      title: "Επαναπροσέγγιση «κρύων» leads",
      impact: 4, confidence: 4, ease: 3, cost: 1, risk: 1,
      stage: "volume",
      metric: "leads_total / reactivation",
      direction: "up",
      duration: "3-4 εβδ.",
      owner: "Αυτοματισμός / Atlas",
      successThreshold: "≥20% των «κρύων» (lost/archived) επανενεργοποιούνται",
      problem: "Ένα μέρος των leads που χάθηκαν/αρχειοθετήθηκαν μπορεί να είναι απλώς άκαιρα.",
      hypothesis: "Μία στοχευμένη ακολουθία (email/WhatsApp) σε leads 30-180 ημερών θα φέρει πίσω σοβαρές ευκαιρίες.",
      experiment: "Export lost/archived leads 30-180 ημερών. Μία σειρά μηνυμάτων, μέτρηση συνομιλιών.",
    },
    {
      id: 4,
      title: "Πρόταση με «εναλλακτικές» (option framing)",
      impact: 4, confidence: 4, ease: 3, cost: 1, risk: 1,
      stage: "close",
      metric: "close_rate",
      direction: "up",
      duration: "3-4 εβδ.",
      owner: "Πωλητής / ο ίδιος",
      successThreshold: "close_rate +5 p.p.",
      problem: "Οι προτάσεις δίνονται χωρίς ξεκάθαρο «επόμενο βήμα», αφήνοντας το deal στον αέρα.",
      hypothesis: "Προσφορά σε δύο καθαρές επιλογές (π.χ. βασική/πλήρης) με σαφές deadline αυξάνει το κλείσιμο.",
      experiment: "Στα επόμενα 10 deals, δώστε 2 επιλογές + ημερομηνία απόφασης. Συγκρίνετε close rate.",
    },
    {
      id: 5,
      title: "Καταγραφή λόγου απώλειας",
      impact: 4, confidence: 5, ease: 5, cost: 1, risk: 1,
      stage: "close",
      metric: "close_rate / lost_reason",
      direction: "up",
      duration: "2-3 εβδ.",
      owner: "Πωλητής / ο ίδιος",
      successThreshold: "≥80% των lost deals με καταγεγραμμένο λόγο",
      problem: "Χωρίς δεδομένα γιατί χάνονται τα deals, είναι αδύνατο να στοχοποιηθεί η βελτίωση.",
      hypothesis: "Η συστηματική καταγραφή λόγου απώλειας θα αποκαλύψει 1-2 κυρίαρχους λόγους, στοχεύσιμους.",
      experiment: "Κάθε lost deal υποχρεωτικά με drop-down λόγο. Ανασκόπηση ανά 2 εβδομάδες.",
    },
    {
      id: 6,
      title: "Follow-up σειρά μετά την πρώτη επαφή",
      impact: 4, confidence: 3, ease: 3, cost: 2, risk: 1,
      stage: "contact",
      metric: "contact_rate",
      direction: "up",
      duration: "4-5 εβδ.",
      owner: "Atlas / αυτοματισμός",
      successThreshold: "≥30% των leads χωρίς απάντηση απαντά μετά τη σειρά",
      problem: "Ένα μόνο touch δεν αρκεί για να απαντήσει ένα lead.",
      hypothesis: "Σειρά 3 follow-up (email/WhatsApp/τηλέφωνο) σε 7 ημέρες φέρνει απαντήσεις από αδρανή leads.",
      experiment: "Νέα σειρά επικοινωνίας για 4 εβδομάδες. Μέτρηση επαφών από αδρανή leads.",
    },
    {
      id: 7,
      title: "Αύξηση εισερχόμενου όγκου (γεωγραφία/κανάλια)",
      impact: 4, confidence: 3, ease: 2, cost: 3, risk: 2,
      stage: "volume",
      metric: "leads_total",
      direction: "up",
      duration: "6-8 εβδ.",
      owner: "Marketing / Atlas",
      successThreshold: "+25% νέων leads/μήνα διατηρήσιμα",
      problem: "Ο συνολικός όγκος εισερχόμενων μπορεί να είναι ο πραγματικός περιορισμός αν τα ποσοστά είναι υγιή.",
      hypothesis: "Ενίσχυση 1-2 καναλιών (SEO τοπικά/Google Ads μικρός budget) αυξάνει τον όγκο χωρίς να πέσει η ποιότητα.",
      experiment: "Δοκιμή 6-8 εβδομάδων σε ένα κανάλι, μέτρηση νέων qualified leads.",
    },
    {
      id: 8,
      title: "CRM hygiene: κανάλια / tags / pipeline ενήμερα",
      impact: 3, confidence: 4, ease: 4, cost: 1, risk: 1,
      stage: "all",
      metric: "data quality",
      direction: "up",
      duration: "2-3 εβδ.",
      owner: "Πωλητής / ο ίδιος",
      successThreshold: "100% των deals με σωστό stage & λόγο",
      problem: "Το CRM μπορεί να υποεκτιμά τα ποσοστά λόγω κακής καταγραφής (π.χ. deals σε λάθος stage).",
      hypothesis: "Καθαρισμός pipeline (σωστά stages, λόγοι, πηγές) δίνει έγκυρα δεδομένα για αποφάσεις.",
      experiment: "Ένα απόγευμα hygiene: κάθε deal validated. Σύγκριση metrics πριν/μετά.",
    },
    {
      id: 9,
      title: "Αυτόματη βαθμολογία & ειδοποιήσεις leads (Atlas)",
      impact: 3, confidence: 3, ease: 3, cost: 2, risk: 1,
      stage: "contact",
      metric: "contact_time / contact_rate",
      direction: "up",
      duration: "4-6 εβδ.",
      owner: "Atlas",
      successThreshold: "Μέσος χρόνος απάντησης <15' • contact_rate +10 p.p.",
      problem: "Χωρίς αυτοματοποίηση, η πρώτη απάντηση εξαρτάται από το φόρτο της ημέρας.",
      hypothesis: "Αν ο Atlas βαθμολογεί (lead score) και ειδοποιεί άμεσα, η πρώτη επαφή γίνεται πάντα γρήγορα.",
      experiment: "Ενεργοποίηση score + notification. Μέτρηση χρόνου απάντησης για 20 νέα leads.",
    },
    {
      id: 10,
      title: "Ονομαστικό δείγμα: αύξηση μέσου deal size μέσω upsell",
      impact: 3, confidence: 3, ease: 2, cost: 2, risk: 1,
      stage: "close",
      metric: "avg_deal_size",
      direction: "up",
      duration: "4-6 εβδ.",
      owner: "Πωλητής / ο ίδιος",
      successThreshold: "avg_deal_size +15%",
      problem: "Το μέσο μέγεθος deal (${fmtEuro(avgRaw)}) μπορεί να αφήνει χρήματα στο τραπέζι.",
      hypothesis: "Συμπληρωματική πρόταση (περισσότερες υπηρεσίες) σε κάθε έγκυρη ευκαιρία ανεβάζει το μέσο deal.",
      experiment: "Σε 10 deals: προτείνετε πάντα 1 επιπλέον υπηρεσία. Μέτρηση μέσου deal size.",
    },
  ];

  return h.map(rank).sort((a, b) => b.score - a.score);
}