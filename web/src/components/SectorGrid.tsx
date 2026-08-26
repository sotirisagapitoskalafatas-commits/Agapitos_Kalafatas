"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Factory,
  ShoppingBag,
  Hotel,
  Scale,
  Stethoscope,
  Utensils,
  Dumbbell,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

const sectors = [
  {
    id: "real-estate",
    title: "Real Estate",
    desc: "Αγγελίες, φίλτρα, χάρτης, σύνδεση με iList/MLS, ισχυρό SEO για περιοχές.",
    icon: Building2,
    accent: "border-blue-200 hover:border-blue-500",
  },
  {
    id: "b2b-industry",
    title: "B2B & Βιομηχανία",
    desc: "Κατάλογος προϊόντων, RFQ φόρμες, τεχνικά PDFs, πολυγλωσσικό.",
    icon: Factory,
    accent: "border-purple-200 hover:border-purple-500",
  },
  {
    id: "eshop",
    title: "Eshop",
    desc: "Μεγέθη/χρώματα, feeds Skroutz/BestPrice & GMC, SEO κατηγοριών/brands.",
    icon: ShoppingBag,
    accent: "border-indigo-200 hover:border-indigo-500",
  },
  {
    id: "hotels",
    title: "Ξενοδοχεία",
    desc: "Booking/Channel manager, πολυγλωσσικό, schema Hotel & SEO για κρατήσεις.",
    icon: Hotel,
    accent: "border-emerald-200 hover:border-emerald-500",
  },
  {
    id: "lawyers",
    title: "Δικηγόροι",
    desc: "Πρακτικές, ραντεβού online, φόρμες leads & τοπικό SEO.",
    icon: Scale,
    accent: "border-amber-200 hover:border-amber-500",
  },
  {
    id: "doctors",
    title: "Ιατροί",
    desc: "Online ραντεβού, προφίλ ιατρών, GDPR για ευαίσθητα δεδομένα.",
    icon: Stethoscope,
    accent: "border-rose-200 hover:border-rose-500",
  },
  {
    id: "restaurants",
    title: "Εστιατόρια",
    desc: "Μενού, κρατήσεις, QR menu, rich results & κριτικές.",
    icon: Utensils,
    accent: "border-cyan-200 hover:border-cyan-500",
  },
  {
    id: "gyms",
    title: "Γυμναστήρια",
    desc: "Πρόγραμμα, κρατήσεις, συνδρομές, online πληρωμές.",
    icon: Dumbbell,
    accent: "border-orange-200 hover:border-orange-500",
  },
  {
    id: "education",
    title: "Φροντιστήρια",
    desc: "Μαθήματα/τμήματα, πρόγραμμα, online παρουσίαση, GDPR και τοπικό SEO.",
    icon: GraduationCap,
    accent: "border-teal-200 hover:border-teal-500",
  },
];

export const SectorGrid: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-semibold tracking-wider text-blue-600 uppercase">
            Our Sectors
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-2">
            Ιστοσελίδες για τον δικό σου τομέα
          </h2>
          <p className="text-slate-600 mt-4">
            Πραγματοποιούμε σύγχρονες ψηφιακές λύσεις για επαγγελματίες και
            επιχειρήσεις που θέλουν να ξεχωρίσουν.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectors.map((sector) => {
            const Icon = sector.icon;
            return (
              <div
                key={sector.id}
                className={`bg-slate-50/70 rounded-2xl p-6 border ${
                  sector.accent
                } transition-all duration-300 hover:bg-white hover:shadow-lg flex items-start space-x-4`}
              >
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 flex-shrink-0">
                  <Icon className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {sector.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {sector.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-slate-900 text-white rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">
              Δεν βλέπεις τον δικό σου κλάδο;
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Ρώτησέ μας πώς μπορούμε να βοηθήσουμε την επιχείρησή σου.
            </p>
          </div>
          <Link
            href="/contact"
            className="mt-4 md:mt-0 inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <span>Επικοινώνησε μαζί μας</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
