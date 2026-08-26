"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Flame,
  Sun,
  Car,
  BatteryCharging,
  TrendingDown,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Upload,
  Menu,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const faqs = [
  {
    q: "Είναι δωρεάν η υπηρεσία;",
    a: "Ναι, η υπηρεσία μας είναι εντελώς δωρεάν, χωρίς κρυφές χρεώσεις. Αποζημιωνόμαστε από τους παρόχους, όχι από εσάς.",
  },
  {
    q: "Πώς γίνεται η αλλαγή παρόχου;",
    a: "Η διαδικασία είναι απλή και διεκπεραιώνεται εξ ολοκλήρου από εμάς. Δεν απαιτείται καμία αλλαγή στον μετρητή ή καλωδίωση.",
  },
  {
    q: "Χρειάζεται να πληρώσω για αλλαγή;",
    a: "Όχι, η αλλαγή παρόχου ηλεκτρικού ρεύματος ή φυσικού αερίου είναι απολύτως δωρεάν.",
  },
  {
    q: "Πόσος χρόνος χρειάζεται;",
    a: "Συνήθως απαιτούνται περίπου 7 εργάσιμες ημέρες για την ολοκλήρωση της μετάβασης στον νέο πάροχο.",
  },
  {
    q: "Μπορεί να διακοπεί το ρεύμα;",
    a: "Σε καμία περίπτωση. Η ηλεκτροδότωση παραμένει αδιάλειπτη καθ' όλη τη διάρκεια της διαδικασίας.",
  },
];

const services = [
  { title: "Ρεύμα", desc: "Φθηνά προγράμματα ενέργειας ειδικά για σένα. Συγκρίνουμε πάροχους και βρίσκουμε την πιο αποδοτική λύση.", icon: Zap, iconColor: "text-amber-500" },
  { title: "Αέριο", desc: "Εξατομικευμένες λύσεις φυσικού αερίου για το σπίτι και την επιχείρηση με τα καλύτερα τιμολογιακά πλάνα.", icon: Flame, iconColor: "text-orange-500" },
  { title: "Φωτοβολταϊκά", desc: "Καινοτομία και βιώσιμη ανάπτυξη στον χώρο σου. Επένδυσε στην πράσινη ενέργεια με ασφάλεια.", icon: Sun, iconColor: "text-yellow-500" },
  { title: "Ηλεκτροκίνηση", desc: "Οδηγούμε οικολογικά, κινούμαστε ηλεκτρικά. Λύσεις φόρτισης και EV για κάθε ανάγκη.", icon: Car, iconColor: "text-blue-500" },
  { title: "Αποθήκευση Ενέργειας", desc: "Λύσεις αποθήκευσης ενέργειας με μπαταρίες για αυτονομία και εξοικονόμηση.", icon: BatteryCharging, iconColor: "text-emerald-500" },
  { title: "Εξοικονόμηση Ενέργειας", desc: "Ανάλυση κατανάλωσης και στρατηγικές για μείωση του λογαριασμού ρεύματος.", icon: TrendingDown, iconColor: "text-indigo-500" },
];

const regions = [
  { title: "Αττική", desc: "Η αφετηρία της εξοικονόμησης. Συγκρίνουμε άμεσα τα προγράμματα για σπίτι ή επιχείρηση.", location: "Αθήνα" },
  { title: "Κεντρική Ελλάδα", desc: "Λύσεις για κάθε κατανάλωση, από μικρές κατοικίες μέχρι αγροτικές εγκαταστάσεις.", location: "Θεσσαλία" },
  { title: "Βόρεια Ελλάδα", desc: "Υποστήριξη για επιχειρήσεις και οικογένειες σε Μακεδονία & Θράκη.", location: "Θεσσαλονίκη" },
  { title: "Νησιά Ιονίου", desc: "Εξυπηρέτηση σε κάθε νησί με προτάσεις που λαμβάνουν υπόψη την εποχικότητα.", location: "Κέρκυρα · Ζάκυνθος" },
  { title: "Νησιά Αιγαίου", desc: "Προγράμματα ρεύματος, φωτοβολταϊκά και λύσεις ηλεκτροκίνησης.", location: "Κυκλάδες · Δωδεκάνησα" },
  { title: "Κρήτη", desc: "Σχεδιάζουμε το επόμενο βήμα με ενεργειακή αυτονομία και τουριστικές μονάδες.", location: "Ηράκλειο · Χανιά" },
];

export default function EnergyPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-600" /> Εξειδικευμένοι Σύμβουλοι Ενέργειας
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Ο προσωπικός σου <span className="text-amber-500">σύμβουλος ενέργειας</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
              Δίπλα σου με όλες τις ενεργειακές λύσεις για το σπίτι και την επιχείρησή σου! Συγκρίνουμε και βρίσκουμε μαζί τον φθηνότερο πάροχο — δωρεάν.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="#contact" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 py-4 rounded-2xl shadow-lg shadow-amber-500/20 text-center transition-all">
                Δες τις Λύσεις
              </a>
              <a href="tel:+306977691776" className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-8 py-4 rounded-2xl transition-all">
                <Phone className="w-5 h-5 text-amber-600" /> +30 697 769 1776
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-100 rounded-3xl p-8 border border-slate-200/80 shadow-inner">
            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="text-3xl font-black text-amber-600 mb-1">100%</div>
                <div className="text-xs font-bold text-slate-500 uppercase">Δωρεάν Υπηρεσία</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="text-3xl font-black text-slate-900 mb-1">7</div>
                <div className="text-xs font-bold text-slate-500 uppercase">Εργάσιμες για Αλλαγή</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="text-3xl font-black text-slate-900 mb-1">24/7</div>
                <div className="text-xs font-bold text-slate-500 uppercase">Υποστήριξη</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="text-3xl font-black text-amber-600 mb-1">12.000+</div>
                <div className="text-xs font-bold text-slate-500 uppercase">Ικανοποιημένοι</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GREECE COVERAGE */}
      <section id="greece" className="py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-black uppercase text-amber-600 tracking-wider">Σε όλη την Ελλάδα</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Η ενέργεια ταξιδεύει μαζί σου</h3>
            <p className="text-slate-600">Καθώς κατεβαίνεις, γνωρίζεις τις λύσεις μας σε κάθε γωνιά της Ελλάδας — από την Αθήνα μέχρι την Κρήτη.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((reg, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-4 right-6 text-4xl font-black text-slate-100 group-hover:text-amber-50 transition-colors">
                  0{idx + 1}
                </div>
                <div className="relative z-10 space-y-3">
                  <h4 className="text-xl font-bold text-slate-900">{reg.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{reg.desc}</p>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-amber-600">
                    <MapPin className="w-3.5 h-3.5" /> {reg.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-black uppercase text-amber-600 tracking-wider">Υπηρεσίες</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Για το σπίτι και την επιχείρηση!</h3>
            <p className="text-slate-600">Ολοκληρωμένες ενεργειακές λύσεις προσαρμοσμένες στις δικές σου ανάγκες.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div key={idx} className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-amber-400 transition-all space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                    <Icon className={`w-6 h-6 ${srv.iconColor}`} />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">{srv.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{srv.desc}</p>
                  <a href="#contact" className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 pt-2">
                    Δες περισσότερα →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT & GDPR */}
      <section id="about" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
              Ποιοι Είμαστε
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Ο προσωπικός σου σύμβουλος ενέργειας!</h2>
            <p className="text-slate-300 leading-relaxed">
              Είμαστε μια ομάδα εξειδικευμένων ενεργειακών συμβούλων, αφοσιωμένοι στη δημιουργία αξίας και ασφάλειας για τους πελάτες μας. Στόχος μας είναι η παροχή ολοκληρωμένων ενεργειακών λύσεων που ικανοποιούν πλήρως τις ανάγκες και τις προσδοκίες σου.
            </p>
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <h3 className="font-bold text-amber-400">Το όραμά μας</h3>
              <p className="text-sm text-slate-300">
                Διασφαλίζουμε ότι κάθε πελάτης έχει τον δικό του ατομικό σύμβουλο ενέργειας, που παρέχει εξατομικευμένες υπηρεσίες καθ&apos; όλη τη διάρκεια της συνεργασίας.
              </p>
            </div>
          </div>

          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldCheck className="w-8 h-8" />
              <span className="font-bold text-lg">Privacy-First Architecture</span>
            </div>
            <h3 className="text-xl font-bold">Το GDPR δεν είναι checkbox. Είναι η αρχιτεκτονική.</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Το σύστημά μας είναι χτισμένο privacy-first. Δεν κάνουμε ποτέ scraping third-party sites ή social platforms. Κάθε επαφή έχει τεκμηριωμένο lawful basis και μπορεί να ασκήσει τα δικαιώματά της από ένα self-service πάνελ.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-xs font-black uppercase text-amber-600 tracking-wider">Συχνές Ερωτήσεις</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Όλα όσα χρειάζεται να γνωρίζεις</h3>
            <p className="text-slate-600">Όλα όσα πρέπει να ξέρεις για την αλλαγή παρόχου ενέργειας.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-slate-900 hover:text-amber-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section id="contact" className="py-24 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
              Ζητήστε να σας καλέσουμε!
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Έτοιμος να εξοικονομήσεις χρήματα;</h2>
            <p className="text-slate-600 leading-relaxed">
              Συμπλήρωσε τη φόρμα και ένας εξειδικευμένος σύμβουλος θα επικοινωνήσει άμεσα για να σου προτείνει το κατάλληλο πρόγραμμα — ΔΩΡΕΑΝ!
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <Phone className="w-5 h-5 text-amber-600" />
                <span>+30 697 769 1776</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 font-medium">
                <Mail className="w-5 h-5 text-amber-600" />
                <span>kalafatasagapitos@gmail.com</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
            <form onSubmit={(e) => { e.preventDefault(); alert("Η αίτηση στάλθηκε επιτυχώς!"); }} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Όνομα</label>
                  <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Επώνυμο</label>
                  <input type="text" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Email (προαιρετικό)</label>
                  <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Τηλέφωνο *</label>
                  <input type="tel" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Τύπος Ακινήτου *</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none">
                    <option>Σπίτι</option>
                    <option>Επιχείρηση</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Περιοχή</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none">
                    <option>Αττική</option>
                    <option>Θεσσαλονίκη</option>
                    <option>Κεντρική Μακεδονία</option>
                    <option>Κρήτη</option>
                    <option>Άλλη Περιοχή</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Υπηρεσία</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none">
                    <option>Ρεύμα</option>
                    <option>Φυσικό Αέριο</option>
                    <option>Φωτοβολταϊκά</option>
                    <option>Ηλεκτροκίνηση</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Ανέβασε λογαριασμούς / αρχεία (προαιρετικό)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">PDF, JPG ή PNG έως 25MB — πολλαπλά αρχεία</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input type="checkbox" required className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                <label className="text-xs text-slate-600 leading-relaxed">
                  Συναινώ στην επεξεργασία των δεδομένων μου για να επικοινωνήσετε μαζί μου, σύμφωνα με την πολιτική απορρήτου GDPR.
                </label>
              </div>
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-4 rounded-2xl shadow-lg shadow-amber-500/20 transition-all text-center">
                Ζητήστε κλήση
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-white">Agapitos Kalafatas</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Εξειδικευμένοι Σύμβουλοι Ενέργειας. Συγκρίνουμε και βρίσκουμε μαζί τον φθηνότερο πάροχο ενέργειας για το σπίτι και την επιχείρησή σου.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Επικοινωνία</h4>
            <p className="text-xs">+30 697 769 1776</p>
            <p className="text-xs">kalafatasagapitos@gmail.com</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Υπηρεσίες</h4>
            <p className="text-xs">Ρεύμα · Αέριο · Φωτοβολταϊκά · Ηλεκτροκίνηση</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <p>© 2026 Agapitos Kalafatas. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white">Αρχική</Link>
            <Link href="/contact" className="hover:text-white">Επικοινωνία</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
