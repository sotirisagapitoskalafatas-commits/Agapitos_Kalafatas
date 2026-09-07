"use client";

import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export default function GdprPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <section className="pt-32 pb-20">
          <div className="mx-auto max-w-3xl px-6">
            <span className="mb-6 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
              GDPR
            </span>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              Πολιτική GDPR & Προστασία Δεδομένων
            </h1>
            <p className="mt-3 text-sm text-slate-400">Τελευταία ενημέρωση: Σεπτέμβριος 2026</p>

            <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-slate-600">
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">Υπεύθυνος Επεξεργασίας</h2>
                <p>
                  Υπεύθυνος Επεξεργασίας είναι ο Agapitos Kalafatas. Όλες οι
                  επεξεργασίες γίνονται σύμφωνα με τον GDPR (Κανονισμός ΕΕ 2016/679)
                  και την ελληνική νομοθεσία προστασίας δεδομένων.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">Αρχές επεξεργασίας</h2>
                <ul className="list-disc space-y-1 pl-6">
                  <li>Νομιμότητα, αντικειμενικότητα και διαφάνεια.</li>
                  <li>Περιορισμός του σκοπού — μόνο για όσα μας ζητήσεις.</li>
                  <li>Ελαχιστοποίηση δεδομένων — μόνο τα απαραίτητα.</li>
                  <li>Ακρίβεια, περιορισμός αποθήκευσης, ακεραιότητα και εμπιστευτικότητα.</li>
                </ul>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">Νομικές βάσεις</h2>
                <p>
                  Συγκατάθεση (φόρμες, marketing), εκτέλεση σύμβασης (παραγγελίες,
                  προσφορές), έννομο συμφέρον (ασφάλεια, βελτίωση υπηρεσιών) και
                  νομική υποχρέωση (φορολογικές/λογιστικές απαιτήσεις).
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">Αποδέκτες</h2>
                <p>
                  Τα δεδομένα μοιράζονται μόνο με Τρίτους Εκτελούντες που παρέχουν
                  απαραίτητες υποδομές (φιλοξενία, email, CRM) και μόνο με
                  συμβατικές εγγυήσεις συμμόρφωσης με τον GDPR.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">Ασφάλεια</h2>
                <p>
                  Εφαρμόζονται τεχνικά και οργανωτικά μέτρα: κρυπτογράφηση (TLS),
                  έλεγχος πρόσβασης, αντίγραφα ασφαλείας και διαχείριση κινδύνων.
                  Κανένα σύστημα δεν είναι απολύτως ασφαλές· κάθε παραβίαση
                  αξιολογείται και κοινοποιείται εφόσον απαιτείται από τον νόμο.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">Τα δικαιώματά σου</h2>
                <p>
                  Πρόσβαση, διόρθωση, διαγραφή, περιορισμός, φορητότητα, αντίρρηση
                  και ανάκληση συγκατάθεσης. Κάθε αίτημα εξετάζεται εντός 30 ημερών.
                  Έχεις επίσης δικαίωμα καταγγελίας στην Αρχή Προστασίας
                  Δεδομένων Προσωπικού Χαρακτήρα.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold text-slate-900">Επικοινωνία</h2>
                <p>
                  Για ασκήσεις δικαιωμάτων σχετικές με τον GDPR χρησιμοποίησε τη
                  σελίδα{" "}
                  <a href="/contact" className="text-emerald-700 underline">Επικοινωνία</a>{" "}
                  και σημείωσε το αίτημά σου.
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