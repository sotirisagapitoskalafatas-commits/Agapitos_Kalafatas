"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Globe,
  Palette,
  TrendingUp,
  Megaphone,
  Smartphone,
  Server,
  Code2,
} from "lucide-react";

interface ServiceItem {
  slug: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const services: ServiceItem[] = [
  {
    slug: "web-development",
    title: "Κατασκευή Ιστοσελίδων",
    description:
      "Αξιόπιστη, γρήγορη και φιλική προς τα κινητά ψηφιακή παρουσία σχεδιασμένη για μέγιστες μετατροπές.",
    icon: Globe,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    slug: "eshop-development",
    title: "Κατασκευή E-shop",
    description:
      "Υψηλών επιδόσεων e-commerce πλατφόρμες με SEO, ταχύτητα, διασύνδεση τραπεζών και ERP.",
    icon: ShoppingBag,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    slug: "ux-ui-branding",
    title: "UX/UI Σχεδιασμός & Branding",
    description:
      "Σύγχρονος αισθητικός σχεδιασμός και εμπειρία χρήστη που ξεχωρίζει την επιχείρησή σας.",
    icon: Palette,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    slug: "seo-performance",
    title: "SEO & Web Performance",
    description:
      "Βελτιστοποίηση κατάταξης στις μηχανές αναζήτησης και αστραπιαίες ταχύτητες φόρτωσης.",
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing & Διαφήμιση",
    description:
      "Στοχευμένες καμπάνιες με μετρήσιμο ROI που απογειώνουν τις πωλήσεις σας.",
    icon: Megaphone,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    slug: "web-mobile-apps",
    title: "Ανάπτυξη Web & Mobile Apps",
    description:
      "Custom εφαρμογές, SaaS πλατφόρμες και portals κομμένα στα μέτρα των αναγκών σας.",
    icon: Smartphone,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
  {
    slug: "hosting-support",
    title: "Υποστήριξη & Hosting",
    description:
      "Τεχνική υποστήριξη, συνεχείς αναβαθμίσεις, hosting υψηλής ταχύτητας και μέγιστη ασφάλεια.",
    icon: Server,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    slug: "custom-integrations",
    title: "Custom Ανάπτυξη & Ενσωματώσεις",
    description:
      "Σύνδεση συστημάτων, API integrations, CRM και έξυπνες AI αυτοματοποιήσεις.",
    icon: Code2,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-700",
  },
];

export const ServiceGrid: React.FC = () => {
  return (
    <section className="py-16 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-sm font-semibold tracking-wider text-blue-600 uppercase">
            Υπηρεσίες
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-2">
            Ψηφιακές λύσεις που απογειώνουν την επιχείρησή σας
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl ${service.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-6 h-6 ${service.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  Μάθετε περισσότερα &rarr;
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
