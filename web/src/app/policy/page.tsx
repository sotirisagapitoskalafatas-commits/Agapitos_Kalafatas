"use client";

import Link from "next/link";
import { FileText, ShieldCheck, Scale, Lock, Cookie, ScrollText, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

const links = [
  {
    href: "/about",
    title: "About",
    desc: "Ποιοι είμαστε και πώς δουλεύουμε — the recipe.",
    icon: FileText,
    color: "bg-amber-50 border-amber-100 text-amber-600",
  },
  {
    href: "/privacy-policy",
    title: "Πολιτική Απορρήτου",
    desc: "Ποια δεδομένα συλλέγουμε και πώς τα χρησιμοποιούμε.",
    icon: Lock,
    color: "bg-sky-50 border-sky-100 text-sky-600",
  },
  {
    href: "/terms-of-use",
    title: "Όροι Χρήσης",
    desc: "Οι κανόνες χρήσης του ιστοτόπου και των υπηρεσιών.",
    icon: ScrollText,
    color: "bg-violet-50 border-violet-100 text-violet-600",
  },
  {
    href: "/gdpr",
    title: "GDPR",
    desc: "Προστασία προσωπικών δεδομένων βάσει ΕΕ 2016/679.",
    icon: ShieldCheck,
    color: "bg-emerald-50 border-emerald-100 text-emerald-600",
  },
  {
    href: "/cookies",
    title: "Cookies",
    desc: "Ποια cookies χρησιμοποιούνται και πώς τα διαχειρίζεσαι.",
    icon: Cookie,
    color: "bg-orange-50 border-orange-100 text-orange-600",
  },
  {
    href: "/contact",
    title: "Επικοινωνία",
    desc: "Για ερωτήσεις, ασκήσεις δικαιωμάτων ή συνεργασία.",
    icon: Scale,
    color: "bg-rose-50 border-rose-100 text-rose-600",
  },
];

export default function PolicyHubPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <section className="pt-32 pb-20">
          <div className="mx-auto max-w-4xl px-6">
            <span className="mb-6 inline-block rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm">
              Policy Hub
            </span>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              Νομικές Σελίδες & Πολιτικές
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              Όλες οι νομικές σελίδες και οι πολιτικές του ιστοτόπου σε ένα σημείο.
              Αν έχεις οποιαδήποτε απορία, επικοινώνησε μαζί μας.
            </p>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {links.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
                  >
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border ${item.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}