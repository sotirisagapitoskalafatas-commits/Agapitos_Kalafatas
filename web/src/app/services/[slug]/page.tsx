"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Shield,
  Clock,
  BarChart3,
} from "lucide-react";
import { FaqSection } from "@/components/FaqSection";

interface PageProps {
  params: { slug: string };
}

const serviceDataMap: Record<
  string,
  {
    title: string;
    subtitle: string;
    valueProp: string;
    features: { title: string; desc: string }[];
    techStack: string[];
    faqs: { q: string; a: string }[];
    ctaTitle: string;
    ctaDesc: string;
  }
> = {
  "web-development": {
    title: "Custom Κατασκευή Ιστοσελίδων Υψηλής Αισθητικής",
    subtitle:
      "Η ψηφιακή σας βιτρίνα σχεδιασμένη για να ξεχωρίζει. Δημιουργούμε γρήγορες, ασφαλείς και responsive ιστοσελίδες που μετατρέπουν τους επισκέπτες σε πελάτες.",
    valueProp:
      "Ένα επιτυχημένο site δεν είναι απλά όμορφο — μετατρέπει. Εστιάζουμε στην ταχύτητα, τη mobile εμπειρία και τη στρατηγική που φέρνει πελάτες.",
    features: [
      {
        title: "Mobile-First & Responsive Architecture",
        desc: "Πλήρης προσαρμογή σε όλες τις οθόνες με προτεραιότητα στη χρηστικότητα από κινητά.",
      },
      {
        title: "Core Web Vitals Optimization",
        desc: "Καθαρός κώδικας χωρίς περιττά plugins για αστραπιαία φόρτωση και κορυφαία εμπειρία χρήστη.",
      },
      {
        title: "Αυτόνομη Διαχείριση Περιεχομένου (CMS)",
        desc: "Φιλικό περιβάλλον διαχείρισης για να ανανεώνετε κείμενα, εικόνες και άρθρα χωρίς τεχνικές γνώσεις.",
      },
      {
        title: "On-Page SEO Base",
        desc: "Πλήρης τεχνική προετοιμασία για τις μηχανές αναζήτησης (Meta tags, OpenGraph, XML Sitemaps, Schema.org).",
      },
    ],
    techStack: ["Next.js", "React", "Tailwind CSS", "Supabase"],
    faqs: [
      {
        q: "Πόσο χρόνο χρειάζεται;",
        a: "2-4 εβδομάδες για εταιρική ιστοσελίδα, ανάλογα με την πολυπλοκότητα.",
      },
      {
        q: "Μπορώ να το διαχειρίζομαι μόνος μου;",
        a: "Ναι, παραδίδουμε φιλικό CMS και δωρεάν εκπαίδευση.",
      },
      {
        q: "Περιλαμβάνεται SEO;",
        a: "Ναι, πλήρη On-Page SEO βάση σε κάθε έργο.",
      },
    ],
    ctaTitle: "Έτοιμοι να χτίσετε την ψηφιακή σας παρουσία;",
    ctaDesc:
      "Ζητήστε δωρεάν εκτίμηση έργου και ας συζητήσουμε πώς μπορούμε να βοηθήσουμε.",
  },
  "eshop-development": {
    title: "Custom Κατασκευή E-shop Υψηλών Μετατροπών",
    subtitle:
      "Υψηλών επιδόσεων e-commerce πλατφόρμες με SEO, ταχύτητα, διασύνδεση τραπεζών και ERP.",
    valueProp:
      "Ένα επιτυχημένο e-shop δεν είναι απλά ένας online κατάλογος. Είναι μια μηχανή πωλήσεων 24/7. Εστιάζουμε στην ταχύτητα (υπό 1.5s), την απρόσκοπτη εμπειρία αγοράς και την πλήρη αυτοματοποίηση.",
    features: [
      {
        title: "Αστραπιαία Ταχύτητα & Core Web Vitals",
        desc: "Βελτιστοποιημένος κώδικας για άμεση απόκριση, που κρατά τους αγοραστές στο site.",
      },
      {
        title: "Διασύνδεση με Τράπεζες & IRIS",
        desc: "Άμεση εκτέλεση πληρωμών με κάρτες, IRIS Payment, Klarna, PayPal και αντικαταβολή.",
      },
      {
        title: "Αυτόματη Διασύνδεση με ERP",
        desc: "Ταυτόχρονος συγχρονισμός αποθέματος, τιμών, παραγγελιών και παραστατικών.",
      },
      {
        title: "Feeds για Skroutz, BestPrice & Google Shopping",
        desc: "Έτοιμα XML/JSON feeds για άμεση σύνδεση με μηχανές σύγκρισης τιμών.",
      },
      {
        title: "Mobile-First Checkout",
        desc: "Απλοποιημένη διαδικασία αγοράς σε 1-2 βήματα (One-Page Checkout).",
      },
    ],
    techStack: [
      "Next.js",
      "TypeScript",
      "WooCommerce / Custom",
      "Stripe / Viva Wallet",
    ],
    faqs: [
      {
        q: "Πόσο χρόνο χρειάζεται η ολοκλήρωση;",
        a: "3-6 εβδομάδες, ανάλογα με τον όγκο προϊόντων και τις διασυνδέσεις.",
      },
      {
        q: "Μπορώ να διαχειρίζομαι προϊόντα και παραγγελίες;",
        a: "Απόλυτα. Παραδίδουμε φιλικό πίνακα ελέγχου και εκπαίδευση.",
      },
      {
        q: "Περιλαμβάνεται σύνδεση με μεταφορικές;",
        a: "Ναι, ενσωματώνουμε υπολογισμό μεταφορικών και αυτόματη έκδοση voucher.",
      },
    ],
    ctaTitle: "Ετοιμοι να απογειώσετε τις online πωλήσεις σας;",
    ctaDesc:
      "Ζητήστε δωρεάν εκτίμηση έργου για το e-shop σας.",
  },
  "ux-ui-branding": {
    title: "Στρατηγικό UX/UI Design & Εταιρική Ταυτότητα",
    subtitle:
      "Δημιουργούμε οπτικές εμπειρίες που καθηλώνουν. Από το λογότυπο μέχρι το διαδραστικό πρωτότυπο.",
    valueProp:
      "Η εμπειρία χρήστη δεν είναι πολυτέλεια — είναι αναγκαιότητα. Χτίζουμε brands που εμπνέουν εμπιστοσύνη και κάνουν τον χρήστη να επιστρέφει.",
    features: [
      {
        title: "User Research & Wireframing",
        desc: "Ανάλυση ανταγωνισμού και χαρτογράφηση της διαδρομής του χρήστη για μέγιστο Conversion Rate.",
      },
      {
        title: "Interactive Figma Prototypes",
        desc: "Πλήρως λειτουργικά διαδραστικά πρωτότυπα πριν την ανάπτυξη.",
      },
      {
        title: "Design Systems & Component Libraries",
        desc: "Επαναχρησιμοποιήσιμα στοιχεία UI για απόλυτη οπτική συνοχή.",
      },
      {
        title: "Rebranding & Brand Identity",
        desc: "Σχεδιασμός λογοτύπου, παλέτας χρωμάτων, τυπογραφίας και brand guidelines.",
      },
    ],
    techStack: ["Figma", "Adobe CC", "Design Tokens", "Tailwind CSS"],
    faqs: [
      {
        q: "Χρειάζομαι ανανέωση λογοτύπου;",
        a: "Αν το λογότυπό σας δεν αντιπροσωπεύει πια την επιχείρησή σας, ένα rebrand μπορεί να κάνει τη διαφορά.",
      },
      {
        q: "Πόσο κοστίζει το UX/UI design;",
        a: "Ανάλογα με την πολυπλοκότητα. Ζητήστε προσφορά για ακριβή εκτίμηση.",
      },
    ],
    ctaTitle: "Θέλετε brand που ξεχωρίζει;",
    ctaDesc:
      "Ζητήστε δωρεάν εκτίμηση για UX/UI design και branding.",
  },
  "seo-performance": {
    title: "SEO & Αστραπιαία Ταχύτητα Ιστοσελίδων",
    subtitle:
      "Κατακτήστε την πρώτη σελίδα της Google. Βελτιστοποιούμε την τεχνική δομή και την ταχύτητα φόρτωσης.",
    valueProp:
      "Η πρώτη σελίδα της Google είναι ο νέος βασιλιάς. Χωρίς SEO, είσαστε αόρατοι. Βελτιστοποιούμε κάθε πτυχή για οργανική αύξηση.",
    features: [
      {
        title: "Technical SEO Audit & Fixes",
        desc: "Διόρθωση σφαλμάτων ευρετηρίασης, βελτιστοποίηση URL αρχιτεκτονικής, canonicals.",
      },
      {
        title: "100/100 Lighthouse Speed",
        desc: "Συμπίεση εικόνων WebP/AVIF, Caching, Minification κώδικα.",
      },
      {
        title: "Έρευνα Λέξεων-Κλειδιών",
        desc: "Στοχευμένες λέξεις-κλειδιά υψηλής πρόθεσης αγοράς για τον κλάδο σας.",
      },
      {
        title: "Local SEO & Google Business Profile",
        desc: "Βελτιστοποίηση για τοπικές αναζητήσεις και προσέλκυση πελατών στην περιοχή σας.",
      },
    ],
    techStack: [
      "Google Search Console",
      "Ahrefs",
      "Lighthouse",
      "Cloudflare CDN",
    ],
    faqs: [
      {
        q: "Πόσο γρήγορα βλέπω αποτελέσματα SEO;",
        a: "Τα αποτελέσματα SEO είναι μακροπρόθεσμα. Βελτιώσεις ταχύτητας είναι άμεσες, SEO αποτελέσματα σε 3-6 μήνες.",
      },
      {
        q: "Περιλαμβάνεται local SEO;",
        a: "Ναι, βελτιστοποιούμε Google Business Profile και τοπικές αναζητήσεις.",
      },
    ],
    ctaTitle: "Θέλετε να εμφανίζεστε στην κορυφή της Google;",
    ctaDesc:
      "Ζητήστε δωρεάν SEO audit και αναφορά βελτιώσεων.",
  },
  "digital-marketing": {
    title: "Performance Marketing & Διαφήμιση με Μετρήσιμο ROI",
    subtitle:
      "Αυξήστε τις πωλήσεις και τα leads σας. Σχεδιάζουμε και εκτελούμε στοχευμένες καμπάνιες.",
    valueProp:
      "Κάθε ευρώ που δαπανάτε στη διαφήμιση πρέπει να επιστρέφει. Εστιάζουμε σε μετρήσιμα αποτελέσματα, όχι likes.",
    features: [
      {
        title: "Google Search & Shopping Ads",
        desc: "Στοχευμένες διαφημίσεις αναζήτησης για χρήστες που ψάχνουν ενεργά τις υπηρεσίες σας.",
      },
      {
        title: "Meta Ads (Facebook & Instagram)",
        desc: "Δημιουργικό περιεχόμενο και προηγμένη στόχευση κοινού.",
      },
      {
        title: "Conversion Tracking & Analytics",
        desc: "Πλήρης παρακολούθηση μετατροπών με GA4 και Google Tag Manager.",
      },
      {
        title: "Dynamic Remarketing Campaigns",
        desc: "Επαναστόχευση επισκεπτών που δεν ολοκλήρωσαν αγορά.",
      },
    ],
    techStack: [
      "Google Tag Manager",
      "GA4",
      "Meta Pixel",
      "Looker Studio",
    ],
    faqs: [
      {
        q: "Πόσο budget χρειάζομαι για διαφήμιση;",
        a: "Εξαρτάται από τον κλάδο. Ξεκινάμε από €300/μήνα για αποτελεσματικές καμπάνιες.",
      },
      {
        q: "Πώς μετράτε το ROI;",
        a: "Με conversion tracking, GA4 και αναφορές που δείχνουν ακριβώς τι απέδωσε κάθε ευρώ.",
      },
    ],
    ctaTitle: "Θέλετε μετρήσιμα αποτελέσματα από τη διαφήμιση;",
    ctaDesc:
      "Ζητήστε δωρεάν ανάλυση καμπάνιας και στρατηγική.",
  },
  "web-mobile-apps": {
    title: "Custom Web & Mobile Εφαρμογές (SaaS & Portals)",
    subtitle:
      "Μετατρέψτε την ιδέα σας σε λειτουργικό λογισμικό. Αναπτύσσουμε κλιμακώσιμες πλατφόρμες.",
    valueProp:
      "Η ιδέα σας χρειάζεται λογισμικό που κλιμακώνεται. Αναπτύσσουμε SaaS, portals και mobile apps που αντέχουν σε χιλιάδες χρήστες.",
    features: [
      {
        title: "Multi-tenant SaaS Architecture",
        desc: "Ασφαλείς και κλιμακώσιμες αρχιτεκτονικές με διαχωρισμό δεδομένων.",
      },
      {
        title: "Cross-Platform Mobile Apps",
        desc: "iOS & Android από ένα ενιαίο codebase με φυσική απόδοση.",
      },
      {
        title: "Real-time Dashboards",
        desc: "Διαδραστικοί πίνακες ελέγχου με ενημέρωση δεδομένων σε πραγματικό χρόνο.",
      },
      {
        title: "Role-Based Access Control (RBAC)",
        desc: "Αυστηρός έλεγχος δικαιωμάτων πρόσβασης ανά ρόλο χρήστη.",
      },
    ],
    techStack: [
      "React / Next.js",
      "React Native",
      "Supabase",
      "PostgreSQL",
      "Node.js",
    ],
    faqs: [
      {
        q: "Web ή mobile app;",
        a: "Εξαρτάται από τη χρήση. Web apps είναι πιο γρήγορες στην ανάπτυξη, mobile apps δίνουν καλύτερη εμπειρία.",
      },
      {
        q: "Πόσο κοστίζει μια SaaS πλατφόρμα;",
        a: "Ανάλογα με τις λειτουργίες. Ζητήστε αναλυτική προσφορά.",
      },
    ],
    ctaTitle: "Έχετε μια ιδέα για app;",
    ctaDesc:
      "Ζητήστε δωρεάν εκτίμηση για την ανάπτυξη της εφαρμογής σας.",
  },
  "hosting-support": {
    title: "Συνεχής Τεχνική Υποστήριξη & Managed Cloud Hosting",
    subtitle:
      "Εγγυημένη διαθεσιμότητα 99.9% και απόλυτη ασφάλεια. Αναλαμβάνουμε τη συντήρηση 24/7.",
    valueProp:
      "Το site σας πρέπει να είναι πάντα online και ασφαλές. Εμείς αναλαμβάνουμε τη συντήρηση ενώ εσείς εστιάζετε στη δουλειά σας.",
    features: [
      {
        title: "Managed Cloud Hosting",
        desc: "Υποδομές υψηλής ταχύτητας σε AWS/Vercel με αυτόματη αυξομείωση πόρων.",
      },
      {
        title: "Καθημερινά Backup & Disaster Recovery",
        desc: "Ασφαλής αποθήκευση αντιγράφων ασφαλείας για ακαριαία επαναφορά.",
      },
      {
        title: "Security Patching & Malware Protection",
        desc: "Συνεχείς ενημερώσεις ασφαλείας, WAF και αφαίρεση κακόβουλου λογισμικού.",
      },
      {
        title: "24/7 Monitoring & SLA Support",
        desc: "Παρακολούθηση λειτουργίας και άμεση τεχνική απόκριση σε βλάβες.",
      },
    ],
    techStack: ["AWS", "Vercel", "Cloudflare WAF", "Uptime Kuma"],
    faqs: [
      {
        q: "Τι περιλαμβάνει η υποστήριξη;",
        a: "Αναβαθμίσεις, backup, monitoring, ασφάλεια και άμεση τεχνική βοήθεια.",
      },
      {
        q: "Πόσο κοστίζει το hosting;",
        a: "Από €50/μήνα ανάλογα με τις ανάγκες. Ζητήστε προσφορά.",
      },
    ],
    ctaTitle: "Θέλετε ασφαλές και γρήγορο hosting;",
    ctaDesc:
      "Ζητήστε πληροφορίες για managed hosting και υποστήριξη.",
  },
  "custom-integrations": {
    title: "Custom Ανάπτυξη Λογισμικού & Ενσωματώσεις APIs",
    subtitle:
      "Συνδέστε όλα τα επιχειρησιακά σας εργαλεία σε ένα ενιαίο οικοσύστημα.",
    valueProp:
      "Τα εργαλεία σας δεν μιλάνε μεταξύ τους. Εμείς τα συνδέουμε — API integrations, CRM/ERP sync και AI αυτοματοποιήσεις.",
    features: [
      {
        title: "API Development & Integration",
        desc: "Δημιουργία και κατανάλωση REST/GraphQL APIs για ασφαλή ανταλλαγή δεδομένων.",
      },
      {
        title: "CRM & ERP Synchronization",
        desc: "Αυτόματος συγχρονισμός παραγγελιών, πελατών και τιμολογίων.",
      },
      {
        title: "Custom AI Agents & Workflows",
        desc: "Ενσωμάτωση AI μοντέλων για αυτοματοποιημένη εξυπηρέτηση ή επεξεργασία εγγράφων.",
      },
      {
        title: "Database Migrations & ETL Pipelines",
        desc: "Ασφαλής μεταφορά μεγάλου όγκου δεδομένων από παλιά συστήματα.",
      },
    ],
    techStack: [
      "Python",
      "Supabase Edge Functions",
      "REST/GraphQL APIs",
      "OpenAI API",
    ],
    faqs: [
      {
        q: "Μπορείτε να συνδέσετε το ERP μου;",
        a: "Ναι, έχουμε εμπειρία με πολλά ERP συστήματα. Ζητήστε πληροφορίες.",
      },
      {
        q: "Πόσο κοστίζει μια API integration;",
        a: "Ανάλογα με την πολυπλοκότητα. Ζητήστε αναλυτική προσφορά.",
      },
    ],
    ctaTitle: "Χρειάζεστε ενσωμάτωση συστημάτων;",
    ctaDesc:
      "Ζητήστε δωρεάν ανάλυση και πρόταση για τις ενσωματώσεις σας.",
  },
};

export default function ServiceDetailPage({ params }: PageProps) {
  const service = serviceDataMap[params.slug];

  if (!service) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Back Link */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/#services"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Πίσω στις Υπηρεσίες
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-blue-500/20">
            <Zap className="w-3.5 h-3.5" />
            Agapitos Kalafatas
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            {service.title}
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            {service.subtitle}
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/25 text-sm"
            >
              Ζητήστε Δωρεάν Εκτίμηση
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 max-w-5xl mx-auto px-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 md:p-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                Γιατί αυτή η υπηρεσία χρειάζεστε;
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {service.valueProp}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-3 text-slate-900">
          Βασικές Δυνατότητες
        </h2>
        <p className="text-slate-500 mb-10">
          Αυτό που προσφέρουμε σε κάθε έργο:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {service.features.map((feature, i) => (
            <div
              key={i}
              className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 bg-slate-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3 text-slate-900">
            Τεχνολογίες Που Χρησιμοποιούμε
          </h2>
          <p className="text-slate-500 mb-8">
            Εργαζόμαστε με τα πιο σύγχρονα εργαλεία της αγοράς:
          </p>
          <div className="flex flex-wrap gap-3">
            {service.techStack.map((tech, i) => (
              <span
                key={i}
                className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Service-specific FAQ */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-slate-900">
          Συχνές Ερωτήσεις
        </h2>
        <div className="space-y-4">
          {service.faqs.map((faq, i) => (
            <details
              key={i}
              className="bg-white border border-slate-200/80 rounded-xl overflow-hidden group"
            >
              <summary className="p-6 cursor-pointer font-bold text-slate-900 list-none flex justify-between items-center hover:text-blue-600 transition-colors">
                {faq.q}
                <span className="text-slate-400 group-open:rotate-45 transition-transform text-xl">
                  +
                </span>
              </summary>
              <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-400" />
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-extrabold mb-4">
            {service.ctaTitle}
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            {service.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/25"
            >
              Ζητήστε Δωρεάν Εκτίμηση
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition-all border border-white/20"
            >
              Τηλεφωνική Επικοινωνία
              +30 697 769 1776
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
