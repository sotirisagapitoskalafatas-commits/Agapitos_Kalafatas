"use client";

import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export default function TermsOfUsePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <section className="pt-32 pb-20">
          <div className="mx-auto max-w-3xl px-6">
            <span className="mb-6 inline-block rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-700">
              Terms of Use
            </span>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              Όροι Χρήσης
            </h1>
            <p className="mt-3 text-sm text-slate-400">Τελευταία ενημέρωση: Σεπτέμβριος 2026</p>

            <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-slate-600">
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">1. Αποδοχή όρων</h2>
                <p>
                  Χρησιμοποιώντας αυτόν τον ιστότοπο αποδέχεσαι τους παρόντες
                  όρους. Αν δεν συμφωνείς, παρακαλώ μην χρησιμοποιείς τις υπηρεσίες μας.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">2. Υπηρεσίες</h2>
                <p>
                  Παρέχονται υπηρεσίες ψηφιακής ανάπτυξης (e-shop, sites, custom
                  apps, SEO), ενέργειας (ρεύμα, αέριο, φωτοβολταϊκά, EV), ασφάλισης
                  και συμβουλευτικής AI. Τα χαρακτηριστικά και οι τιμές περιγράφονται
                  στις αντίστοιχες σελίδες και ισχύουν όπως αναφέρονται εκεί.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">3. Χρήση περιεχομένου</h2>
                <p>
                  Το περιεχόμενο του ιστοτόπου (κείμενα, εικόνες, logos, code) είναι
                  πνευματική ιδιοκτησία του διαχειριστή και δεν επιτρέπεται η
                  αναπαραγωγή του χωρίς γραπτή άδεια.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">4. Ακρίβεια πληροφοριών</h2>
                <p>
                  Καταβάλλεται κάθε προσπάθεια για την ορθότητα των πληροφοριών,
                  ωστόσο δεν παρέχεται εγγύηση πληρότητας ή ακρίβειας. Τυχόν
                  εκτιμήσεις κόστους/απόδοσης είναι ενδεικτικές.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">5. Ευθύνη</h2>
                <p>
                  Ο διαχειριστής δεν ευθύνεται για άμεσες ή έμμεσες ζημίες που
                  απορρέουν από τη χρήση του ιστοτόπου, εντός των ορίων του νόμου.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">6. Αλλαγές στους όρους</h2>
                <p>
                  Οι όροι μπορεί να ενημερώνονται περιοδικά. Η συνέχιση χρήσης μετά
                  από αλλαγές σημαίνει αποδοχή των νέων όρων.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">7. Εφαρμοστέο δίκαιο</h2>
                <p>
                  Οι παρόντες όροι διέπονται από το ελληνικό δίκαιο και οι
                  διαφορές υπάγονται στα ελληνικά δικαστήρια, όπου το επιτρέπει ο νόμος.
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