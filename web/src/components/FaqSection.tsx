"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "Πόσο χρόνο χρειάζεται για να ολοκληρωθεί ένα site;",
    answer:
      "Ο τυπικός χρόνος παράδοσης για μια εταιρική ιστοσελίδα είναι 2-4 εβδομάδες, ενώ για ένα πλήρες e-shop ή custom εφαρμογή απαιτούνται 4-7 εβδομάδες, ανάλογα με την πολυπλοκότητα και τις ενσωματώσεις.",
  },
  {
    question:
      "Μπορώ να διαχειρίζομαι μόνος/η το site μου μετά την κατασκευή;",
    answer:
      "Ναι, απόλυτα. Παραδίδουμε ένα εξαιρετικά φιλικό σύστημα διαχείρισης και παρέχουμε δωρεάν εκπαιδευτικό υλικό/συνεδρία ώστε να μπορείτε να προσθέτετε κείμενα, προϊόντα και εικόνες αυτόνομα.",
  },
  {
    question:
      "Μπορείτε να αναλάβετε την αναβάθμιση ή τον επανασχεδιασμό υπάρχοντος site;",
    answer:
      "Βεβαίως. Αναλαμβάνουμε το redesign παλαιών ιστοσελίδων, μεταφέροντας ασφαλώς τα δεδομένα σας και βελτιώνοντας δραστικά την ταχύτητα, την εμφάνιση και τα ποσοστά μετατροπής.",
  },
  {
    question: "Το site μου θα είναι γρήγορο και responsive;",
    answer:
      "Όλα τα έργα μας σχεδιάζονται με mobile-first προσέγγιση και βελτιστοποιούνται για Core Web Vitals, εξασφαλίζοντας αστραπιαία φόρτωση σε κινητά, tablets και υπολογιστές.",
  },
  {
    question: "Περιλαμβάνεται SEO στην κατασκευή;",
    answer:
      "Ναι. Κάθε ιστοσελίδα παραδίδεται με βασικό On-Page SEO (δομή επικεφαλίδων, meta titles/descriptions, XML sitemap, schema markup και βελτιστοποίηση εικόνων) για άμεση ευρετηρίαση από τη Google.",
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Συχνές Ερωτήσεις (FAQ)
          </h2>
          <p className="text-slate-600 mt-2">
            Απαντήσεις στις πιο κοινές απορίες σχετικά με τις υπηρεσίες μας
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200/80 rounded-xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-bold text-slate-900 pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${
                      isOpen ? "transform rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
