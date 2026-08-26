"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HeartPulse,
  Home,
  Briefcase,
  Car,
  ShieldCheck,
  PiggyBank,
  Plane,
  ChevronDown,
  CheckCircle2,
  Phone,
  PhoneCall,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const insuranceCategories = [
  {
    id: "health",
    title: "Ασφάλιση Υγείας",
    subtitle: "BEWELL",
    icon: HeartPulse,
    color: "text-rose-500",
    bgColor: "bg-rose-50",
    description:
      "Η υγεία αποτελεί μία από τις σημαντικότερες προτεραιότητες για κάθε άνθρωπο και οικογένεια. Η κατάλληλη ασφαλιστική λύση μπορεί να προσφέρει καλύτερη οργάνωση, πρόσβαση σε υπηρεσίες φροντίδας και οικονομική υποστήριξη όταν προκύψει μια ανάγκη.",
    includes: [
      "Νοσοκομειακή περίθαλψη",
      "Διαγνωστικές εξετάσεις",
      "Ιατρική φροντίδα",
      "Προσωπική καθοδήγηση",
    ],
  },
  {
    id: "home",
    title: "Ασφάλιση Κατοικίας",
    icon: Home,
    color: "text-teal-500",
    bgColor: "bg-teal-50",
    description:
      "Η κατοικία είναι ένας από τους σημαντικότερους χώρους της ζωής μας. Η ασφάλισή της συμβάλλει στην προστασία τόσο του ίδιου του ακινήτου όσο και της περιουσίας που βρίσκεται μέσα σε αυτό.",
    includes: [
      "Πυρκαγιά και φυσικά φαινόμενα",
      "Σεισμός και πλημμύρα",
      "Κλοπή και ζημιές",
      "Κτίριο και περιεχόμενο",
      "Ιδιοκατοίκηση ή ενοικιαζόμενο ακίνητο",
    ],
  },
  {
    id: "business",
    title: "Ασφάλιση Επιχείρησης",
    icon: Briefcase,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    description:
      "Κάθε επιχείρηση έχει διαφορετικές ανάγκες, κινδύνους και προτεραιότητες. Η σωστή ασφαλιστική προσέγγιση βοηθά στην προστασία της επαγγελματικής δραστηριότητας και της απρόσκοπτης λειτουργίας της.",
    includes: [
      "Επαγγελματικός χώρος",
      "Εξοπλισμός και εμπορεύματα",
      "Απρόβλεπτες ζημιές",
      "Διακοπή εργασιών",
      "Ευθύνη απέναντι σε πελάτες ή συνεργάτες",
    ],
  },
  {
    id: "auto",
    title: "Ασφάλιση Αυτοκινήτου",
    icon: Car,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    description:
      "Η ασφάλιση αυτοκινήτου δεν αποτελεί μόνο μία απαραίτητη υποχρέωση, αλλά και ένα σημαντικό μέσο προστασίας για τον οδηγό, το όχημα και τους τρίτους.",
    includes: [
      "Υποχρεωτική αστική ευθύνη",
      "Προστασία του οχήματος",
      "Οδική βοήθεια",
      "Θραύση κρυστάλλων",
      "Κλοπή, πυρκαγιά ή φυσικά φαινόμενα",
    ],
  },
  {
    id: "liability",
    title: "Ασφάλιση Αστικής Ευθύνης",
    icon: ShieldCheck,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    description:
      "Η αστική ευθύνη μπορεί να προστατεύσει έναν ιδιώτη ή επαγγελματία από οικονομικές απαιτήσεις τρίτων, όταν προκληθεί σωματική βλάβη ή υλική ζημιά.",
    includes: [
      "Επαγγελματική αστική ευθύνη",
      "Προσωπική ευθύνη",
      "Αποζημιώσεις προς τρίτους",
      "Νομικά έξοδα",
      "Λύσεις ανάλογα με το επάγγελμα ή τη δραστηριότητα",
    ],
  },
  {
    id: "savings",
    title: "Αποταμίευση",
    icon: PiggyBank,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    description:
      "Η συστηματική αποταμίευση μπορεί να βοηθήσει στην επίτευξη προσωπικών και οικογενειακών στόχων, δημιουργώντας μεγαλύτερη οικονομική ασφάλεια για το μέλλον.",
    includes: [
      "Δημιουργία αποθεματικού",
      "Μακροπρόθεσμοι στόχοι",
      "Σπουδές παιδιών",
      "Μελλοντικό συμπληρωματικό εισόδημα",
      "Προσωπικός οικονομικός σχεδιασμός",
    ],
  },
  {
    id: "travel",
    title: "Ταξιδιωτική Ασφάλιση",
    icon: Plane,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50",
    description:
      "Ένα ταξίδι μπορεί να συνοδευτεί από απρόβλεπτες καταστάσεις. Η ταξιδιωτική ασφάλιση προσφέρει επιλογές υποστήριξης για ταξίδια στην Ελλάδα και το εξωτερικό.",
    includes: [
      "Επείγουσα ιατρική βοήθεια",
      "Απρόβλεπτα περιστατικά στο ταξίδι",
      "Αποσκευές και προσωπικά αντικείμενα",
      "Ακύρωση ή αλλαγή ταξιδιού",
      "Υποστήριξη στο εξωτερικό",
    ],
  },
];

export default function InsurancePage() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <Navbar />

      {/* HERO */}
      <section className="bg-gradient-to-b from-rose-50/60 to-slate-50 pt-28 pb-20 lg:pt-36 lg:pb-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" /> Προηγμένες Λύσεις Ασφάλισης
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Ασφάλεια που <span className="text-rose-600">προστατεύει</span> ό,τι αξίζει
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
              Ολοκληρωμένα προγράμματα υγείας (BEWELL), ασφάλιση κατοικίας και αυτοκινήτου με εξατομικευμένη καθοδήγηση και εγγύηση καλύτερης κάλυψης.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#plans" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-rose-600/20 transition-all">
                Δες τα Προγράμματα
              </a>
              <a href="tel:+306977691776" className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold px-6 py-4 rounded-2xl transition-all">
                <Phone className="w-5 h-5 text-rose-600" /> +30 697 769 1776
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Γρήγορη Εκτίμηση Κόστους</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Επιλογή Κλάδου</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Υγεία BEWELL", "Κατοικία", "Αυτοκίνητο"].map((plan) => (
                    <button
                      key={plan}
                      className="py-3 px-2 rounded-xl text-xs font-bold border bg-slate-50 border-slate-200 text-slate-600 hover:bg-rose-50 hover:border-rose-500 hover:text-rose-700 transition-all"
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Ονοματεπώνυμο</label>
                <input
                  type="text"
                  placeholder="π.χ. Γιώργος Παπαδόπουλος"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Τηλέφωνο Επικοινωνίας</label>
                <input
                  type="tel"
                  placeholder="69XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm">
                Ζητήστε Προσφορά
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* INSURANCE CATEGORIES (Accordion) */}
      <section id="plans" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Λύσεις Ασφάλισης
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Επιλέξτε τον τομέα που σας ενδιαφέρει για να δείτε αναλυτικά τι περιλαμβάνει η κάθε κάλυψη — ή επικοινωνήστε μαζί μου για μια εξατομικευμένη πρόταση.
            </p>
          </div>

          <div className="space-y-4">
            {insuranceCategories.map((cat) => {
              const Icon = cat.icon;
              const isOpen = openId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                    isOpen ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"
                  }`}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : cat.id)}
                    className="w-full px-6 py-5 flex items-center justify-between focus:outline-none text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${cat.bgColor} ${cat.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {cat.title}
                          {cat.subtitle && (
                            <span className="ml-2 text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wide">
                              {cat.subtitle}
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                      <p className="text-slate-600 leading-relaxed mb-6">{cat.description}</p>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                          Τι μπορεί να περιλαμβάνει:
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {cat.includes.map((item, index) => (
                            <li key={index} className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                              <span className="text-slate-700 text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-8">
                        <a
                          href="tel:+306977691776"
                          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          <PhoneCall className="w-4 h-4" />
                          Ζητήστε προσφορά
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ADVISOR PROFILE */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-brand-500 rounded-full shrink-0 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">AK</span>
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-xl font-bold text-slate-900">Agapitos Kalafatas</h3>
              <p className="text-rose-600 font-medium text-sm mb-3">
                Ασφαλιστική Σύμβουλος | Digital & Advisory Services
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Από το 2007 βρίσκομαι δίπλα στους ανθρώπους που με εμπιστεύονται, προσφέροντας προσωπική και ουσιαστική ασφαλιστική καθοδήγηση. Στόχος μου είναι να κάνω την ασφάλιση απλή, κατανοητή και ανθρώπινη.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <a
                  href="tel:+306977691776"
                  className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  <PhoneCall className="w-4 h-4" /> +30 697 769 1776
                </a>
                <a
                  href="mailto:kalafatasagapitos@gmail.com"
                  className="px-5 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Στείλτε email
                </a>
                <a
                  href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-white">Agapitos Kalafatas</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Αρχική</Link>
            <Link href="/energy" className="hover:text-white transition-colors">Ενέργεια</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Επικοινωνία</Link>
          </div>
          <p className="text-xs text-slate-500">© 2026 Agapitos Kalafatas. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
