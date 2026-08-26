"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import UnifiedContactForm from "@/components/UnifiedContactForm";
import Scene3DBackground from "@/components/Scene3DBackground";

export default function ContactPage() {
  useEffect(() => {
    gsap.fromTo(".contact-hero", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
    gsap.fromTo(".contact-form", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.3 });
    gsap.fromTo(".contact-info", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", delay: 0.5 });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 relative overflow-hidden">
      <Scene3DBackground className="opacity-20" />

      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">← Home</Link>
            <div className="w-px h-6 bg-slate-200" />
            <h1 className="text-slate-900 font-semibold">Επικοινωνία</h1>
          </div>
          <span className="text-sm text-slate-400">by Agapitos Kalafatas</span>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="contact-hero text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 mb-6">
            Επικοινωνία
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Ζητήστε <span className="gradient-text">Προσφορά</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Ενεργειακές λύσεις, SaaS ανάπτυξη, AI συστήματα και ασφαλιστικές υπηρεσίες.
            Συμπληρώστε τη φόρμα και θα επικοινωνήσουμε άμεσα.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-2 contact-form">
            <UnifiedContactForm />
          </div>

          {/* Info Sidebar */}
          <div className="contact-info space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
              <h3 className="font-bold text-slate-900 mb-4">Τηλεφωνική Επικοινωνία</h3>
              <a href="tel:+306977691776" className="flex items-center gap-3 text-brand-600 hover:text-brand-700 font-semibold transition-colors">
                <span className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center"> </span>
                +30 697 769 1776
              </a>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
              <h3 className="font-bold text-slate-900 mb-4">Email</h3>
              <a href="mailto:kalafatasagapitos@gmail.com" className="flex items-center gap-3 text-brand-600 hover:text-brand-700 font-semibold transition-colors text-sm">
                <span className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">✉️</span>
                kalafatasagapitos@gmail.com
              </a>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
              <h3 className="font-bold text-slate-900 mb-4">Υπηρεσίες</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full" /> SaaS & Web Development</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-yellow-500 rounded-full" /> Ρεύμα & Φυσικό Αέριο</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full" /> Φωτοβολταϊκά & EV</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full" /> AI Agents & Systems</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full" /> Ασφάλεια Ζωής</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-brand-500 to-purple-600 p-6 rounded-2xl text-white">
              <h3 className="font-bold mb-2">Άμεση Επικοινωνία</h3>
              <p className="text-brand-100 text-sm mb-4">Χρειάζεστε άμεση βοήθεια;</p>
              <Link href="/chat" className="inline-block bg-white text-brand-600 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-50 transition-colors">
                Ζητήστε Atlas AI →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs text-slate-400">© 2026 Agapitos Kalafatas. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
