"use client";

import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <section className="pt-32 pb-20">
          <div className="mx-auto max-w-3xl px-6">
            <span className="mb-6 inline-block rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-700">
              GDPR · Privacy Policy
            </span>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              Πολιτική Απορρήτου
            </h1>
            <p className="mt-3 text-sm text-slate-400">Τελευταία ενημέρωση: Σεπτέμβριος 2026</p>

            <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-slate-600">
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">1. Ποιος είμαστε</h2>
                <p>
                  Η ιστοσελίδα λειτουργεί από τον Agapitos Kalafatas (μηχανικός
                  λογισμικού SaaS, Ελλάδα). Για θέματα προστασίας δεδομένων
                  επικοινωνήστε μέσω της φόρμας επικοινωνίας ή της σελίδας{" "}
                  <a href="/contact" className="text-sky-700 underline">Επικοινωνία</a>.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">2. Ποια δεδομένα συλλέγονται</h2>
                <ul className="list-disc space-y-1 pl-6">
                  <li>Στοιχεία που υποβάλλεις σε φόρμες (όνομα, email, τηλέφωνο, εταιρεία).</li>
                  <li>Δεδομένα χρήσης και cookies (βλ. σελίδα Cookies).</li>
                  <li>Περιεχόμενο συνομιλιών με τον Atlas AI, που αξιοποιείται μόνο για την εξυπηρέτησή σου.</li>
                </ul>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">3. Για ποιο σκοπό</h2>
                <p>
                  Τα δεδομένα χρησιμοποιούνται για την απάντηση στα αιτήματά σου,
                  την αποστολή προσφορών (με τη συγκατάθεσή σου), τη βελτίωση των
                  υπηρεσιών και την τήρηση νομικών υποχρεώσεων. Δεν πωλούνται και
                  δεν εκμισθώνονται σε τρίτους.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">4. Βάση νομιμότητας</h2>
                <p>
                  Επεξεργαζόμαστε δεδομένα βάσει του Κανονισμού (ΕΕ) 2016/679
                  (GDPR): συγκατάθεση, εκτέλεση σύμβασης ή προ-συμβατικών μέτρων,
                  έννομο συμφέρον και νομική υποχρέωση, ανάλογα με την περίπτωση.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">5. Δικαιώματά σου</h2>
                <p>Έχεις τα δικαιώματα πρόσβασης, διόρθωσης, διαγραφής, περιορισμού, φορητότητας και αντίρρησης. Μπορείς να ανακαλέσεις τη συγκατάθεσή σου ανά πάσα στιγμή.</p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">6. Διάρκεια τήρησης</h2>
                <p>
                  Τα δεδομένα διατηρούνται όσο χρειάζονται για τον σκοπό για τον
                  οποίο συλλέχθηκαν (τυπικά έως 2 έτη μετά την τελευταία επαφή),
                  εκτός αν προβλέπεται αλλιώς από τη νομοθεσία.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">7. Επικοινωνία</h2>
                <p>
                  Για κάθε αίτημα σχετικό με την προστασία των προσωπικών σου
                  δεδομένων επικοινώνησε μαζί μας. Δικαιούσαι επίσης να υποβάλεις
                  καταγγελία στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα.
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