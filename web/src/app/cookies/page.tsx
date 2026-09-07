"use client";

import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export default function CookiesPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <section className="pt-32 pb-20">
          <div className="mx-auto max-w-3xl px-6">
            <span className="mb-6 inline-block rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-700">
              Cookies Policy
            </span>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              Πολιτική Cookies
            </h1>
            <p className="mt-3 text-sm text-slate-400">Τελευταία ενημέρωση: Σεπτέμβριος 2026</p>

            <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-slate-600">
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">Τι είναι τα cookies</h2>
                <p>
                  Τα cookies είναι μικρά αρχεία κειμένου που αποθηκεύονται στον
                  browser σου για να λειτουργεί σωστά ο ιστότοπος και να θυμάται
                  τις προτιμήσεις σου.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">Ποια cookies χρησιμοποιούμε</h2>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Απαραίτητα:</strong> για βασική λειτουργία (σύνδεση,
                    γλώσσα, ασφάλεια). Απαιτούνται υποχρεωτικά.
                  </li>
                  <li>
                    <strong>Λειτουργικά:</strong> προτιμήσεις γλώσσας και
                    εμφάνισης.
                  </li>
                  <li>
                    <strong>Ανάλυσης:</strong> ανώνυμες μετρήσεις επισκεψιμότητας
                    για τη βελτίωση της εμπειρίας.
                  </li>
                </ul>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">Διαχείριση</h2>
                <p>
                  Μπορείς να διαγράψεις ή να αποκλείσεις τα cookies από τις
                  ρυθμίσεις του browser σου. Η απενεργοποίησή τους μπορεί να
                  επηρεάσει ορισμένες λειτουργίες του ιστοτόπου.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">Τρίτα μέρη</h2>
                <p>
                  Ενδέχεται να χρησιμοποιηθούν υπηρεσίες τρίτων (π.χ. ανάλυσης)
                  που ορίζουν τα δικά τους cookies, σύμφωνα με τις δικές τους
                  πολιτικές απορρήτου.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}