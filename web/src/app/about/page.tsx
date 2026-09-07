"use client";

import Link from "next/link";
import { Lightbulb, PenTool, Rocket, LineChart, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import AtmosTransition from "@/components/AtmosTransition";

const recipe = [
  {
    step: "01",
    title: "Κατανοούμε",
    desc: "Ακούμε τον στόχο σου, την αγορά και τους χρήστες. Χωρίς βαθιά κατανόηση δεν χτίζουμε τίποτα.",
    icon: Lightbulb,
    color: "bg-amber-50 border-amber-100 text-amber-600",
  },
  {
    step: "02",
    title: "Σχεδιάζουμε",
    desc: "Αρχιτεκτονική, εμπειρία χρήστη και τεχνολογία — όλα σχεδιασμένα ώστε να κλιμακώνονται.",
    icon: PenTool,
    color: "bg-sky-50 border-sky-100 text-sky-600",
  },
  {
    step: "03",
    title: "Χτίζουμε",
    desc: "Κατασκευή με σύγχρονα web stacks, AI και αυτοματισμούς. Γρήγορα, μετρίσιμα, αξιόπιστα.",
    icon: Rocket,
    color: "bg-violet-50 border-violet-100 text-violet-600",
  },
  {
    step: "04",
    title: "Εκτελούμε",
    desc: "Λανσάρισμα, βελτιστοποίηση και μέτρηση με δεδομένα — το αποτέλεσμα βελτιώνεται συνέχεια.",
    icon: LineChart,
    color: "bg-emerald-50 border-emerald-100 text-emerald-600",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <section className="relative overflow-hidden pt-32 pb-20">
          <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-[350px] w-[350px] rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <span className="mb-6 inline-block rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-700">
              Ποιοι Είμαστε
            </span>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Agapitos Kalafatas
              <br />
              <span className="bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400 bg-clip-text text-transparent">
                Who we are
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Ένας μηχανικός SaaS με έδρα την Ελλάδα, που ενώνει ψηφιακή ανάπτυξη,
              ενέργεια, ασφάλιση και τεχνητή νοημοσύνη σε λύσεις που δουλεύουν στην
              πράξη — για επιχειρήσεις που θέλουν αποτελέσματα, όχι buzzwords.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <img
                  src="/images/linkedin-logo.jpg"
                  alt="LinkedIn"
                  className="h-5 w-5 rounded object-cover"
                />
                LinkedIn
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-600 to-amber-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition-all hover:from-amber-700 hover:to-amber-600"
              >
                Επικοινωνία
              </Link>
            </div>
          </div>
        </section>

        <AtmosTransition />

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="mb-10 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Our Recipe
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {recipe.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${item.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-black text-slate-300">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="pb-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-violet-50 p-10 md:p-14 text-center shadow-sm">
              <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
                Ας χτίσουμε το επόμενο βήμα σου
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-600">
                Είτε είναι ένα e-shop, μια ενεργειακή λύση ή ασφάλιση με προσωπική
                φροντίδα — ξεκινάμε με μια συζήτηση.
              </p>
              <Link
                href="/contact"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-600 to-violet-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition-all hover:from-violet-700 hover:to-violet-600"
              >
                Μίλησε με τον Atlas AI
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}