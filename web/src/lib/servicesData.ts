export interface ServiceDetail {
  slug: string;
  icon: string;
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  whyTitle: string;
  whyText: string;
  benefits: { title: string; desc: string }[];
  offerings: { title: string; items: string[] }[];
  audience: string[];
  faqs: { q: string; a: string }[];
  ctaTitle: string;
  ctaDesc: string;
}

export const servicesData: Record<string, ServiceDetail> = {
  "web-development": {
    slug: "web-development",
    icon: "🌐",
    heroTitle: "Custom Κατασκευή Ιστοσελίδων Υψηλής Αισθητικής",
    heroSubtitle:
      "Η ψηφιακή σας βιτρίνα σχεδιασμένη για να ξεχωρίζει. Δημιουργούμε γρήγορες, ασφαλείς και responsive ιστοσελίδες που μετατρέπουν τους επισκέπτες σε πελάτες.",
    heroTagline: "Επενδύστε σε μια ιστοσελίδα που μετατρέπει.",
    whyTitle: "Γιατί μια καλή ιστοσελίδα κάνει τη διαφορά",
    whyText:
      "Ένα επιτυχημένο site δεν είναι απλά όμορφο — μετατρέπει. Εστιάζουμε στην ταχύτητα, τη mobile εμπειρία και τη στρατηγική που φέρνει πελάτες.",
    benefits: [
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
      {
        title: "Ασφάλεια & SSL",
        desc: "HTTPS encryption, firewall προστασία και τακτικά backup για απόλυτη ασφάλεια.",
      },
      {
        title: "Analytics & Tracking",
        desc: "Ενσωμάτωση Google Analytics 4 και conversion tracking για μετρήσιμα αποτελέσματα.",
      },
    ],
    offerings: [
      {
        title: "Τι περιλαμβάνει",
        items: [
          "Σχεδιασμός UI/UX πριν την ανάπτυξη",
          "Ανάπτυξη με Next.js/React",
          "Responsive σε όλες τις συσκευές",
          "CMS για αυτόνομη διαχείριση",
          "SEO βελτιστοποίηση",
          "Δωρεάν εκπαίδευση χρήσης",
          "1 μήνας δωρεάν υποστήριξη",
        ],
      },
    ],
    audience: [
      "Επιχειρήσεις που θέλουν επαγγελματική παρουσία",
      "Ελεύθεροι επαγγελματίες & consultants",
      "Εκπαιδευτικοί οργανισμοί",
      "Μικρές & μεσαίες επιχειρήσεις",
    ],
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
      {
        q: "Πόσο κοστίζει μια ιστοσελίδα;",
        a: "Από €1.200 για βασική ιστοσελίδα. Ζητήστε δωρεάν εκτίμηση.",
      },
    ],
    ctaTitle: "Έτοιμοι να χτίσετε την ψηφιακή σας παρουσία;",
    ctaDesc:
      "Ζητήστε δωρεάν εκτίμηση έργου και ας συζητήσουμε πώς μπορούμε να βοηθήσουμε.",
  },
  "eshop-development": {
    slug: "eshop-development",
    icon: "🛒",
    heroTitle: "Custom Κατασκευή E-shop Υψηλών Μετατροπών",
    heroSubtitle:
      "Υψηλών επιδόσεων e-commerce πλατφόρμες με SEO, ταχύτητα, διασύνδεση τραπεζών και ERP.",
    heroTagline: "Μετατρέψτε τους επισκέπτες σε αγοραστές.",
    whyTitle: "Γιατί ένα e-shop κερδίζει πελάτες 24/7",
    whyText:
      "Ένα επιτυχημένο e-shop δεν είναι απλά ένας online κατάλογος. Είναι μια μηχανή πωλήσεων 24/7. Εστιάζουμε στην ταχύτητα (υπό 1.5s), την απρόσκοπτη εμπειρία αγοράς και την πλήρη αυτοματοποίηση.",
    benefits: [
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
      {
        title: "Multi-language & Multi-currency",
        desc: "Υποστήριξη πολλαπλών γλωσσών και νομισμάτων για διεθνή αγορά.",
      },
    ],
    offerings: [
      {
        title: "Τι περιλαμβάνει",
        items: [
          "Custom e-commerce ανάπτυξη",
          "Πλήρης διαχείριση προϊόντων",
          "Σύνδεση τραπεζών & πληρωμών",
          "Skroutz/BestPrice feeds",
          "SEO & Google Shopping",
          "Mobile-First checkout",
          "Αυτόματα παραστατικά",
          "1 μήνας δωρεάν υποστήριξη",
        ],
      },
    ],
    audience: [
      "Επιχειρήσεις e-commerce",
      "Μάρκετ που θέλουν online πωλήσεις",
      "Λιανικό εμπόριο",
      "B2B κατασκευαστές",
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
      {
        q: "Μπορώ να διαχειρίζομαι προσφορές και κουπόνια;",
        a: "Ναι, υποστηρίζουμε coupons, flash sales, bundles και loyalty προγράμματα.",
      },
    ],
    ctaTitle: "Ετοιμοι να απογειώσετε τις online πωλήσεις σας;",
    ctaDesc:
      "Ζητήστε δωρεάν εκτίμηση έργου για το e-shop σας.",
  },
  "ux-ui-branding": {
    slug: "ux-ui-branding",
    icon: "🎨",
    heroTitle: "Στρατηγικό UX/UI Design & Εταιρική Ταυτότητα",
    heroSubtitle:
      "Δημιουργούμε οπτικές εμπειρίες που καθηλώνουν. Από το λογότυπο μέχρι το διαδραστικό πρωτότυπο.",
    heroTagline: "Design που εμπνέει εμπιστοσύνη.",
    whyTitle: "Γιατί ο σχεδιασμός δημιουργεί αξία",
    whyText:
      "Η εμπειρία χρήστη δεν είναι πολυτέλεια — είναι αναγκαιότητα. Χτίζουμε brands που εμπνέουν εμπιστοσύνη και κάνουν τον χρήστη να επιστρέφει.",
    benefits: [
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
      {
        title: "Accessibility (WCAG 2.1)",
        desc: "Σχεδίαση που πληροί τα πρότυπα προσβασιμότητας για όλους τους χρήστες.",
      },
      {
        title: "A/B Testing Strategy",
        desc: "Δοκιμές σχεδίων για βελτιστοποίηση conversion rates.",
      },
    ],
    offerings: [
      {
        title: "Τι περιλαμβάνει",
        items: [
          "User research & ανάλυση ανταγωνισμού",
          "Wireframes & interactive prototypes",
          "UI design σε Figma",
          "Design system & component library",
          "Brand identity (logo, χρώματα, τυπογραφία)",
          "Brand guidelines πεδίο",
          "A/B testing strategy",
        ],
      },
    ],
    audience: [
      "Νέες επιχειρήσεις που χρειάζονται brand",
      "Ιστοσελίδες με χαμηλό conversion rate",
      "Εταιρίες που θέλουν rebrand",
      "SaaS πλατφόρμες",
    ],
    faqs: [
      {
        q: "Χρειάζομαι ανανέωση λογοτύπου;",
        a: "Αν το λογότυπό σας δεν αντιπροσωπεύει πια την επιχείρησή σας, ένα rebrand μπορεί να κάνει τη διαφορά.",
      },
      {
        q: "Πόσο κοστίζει το UX/UI design;",
        a: "Ανάλογα με την πολυπλοκότητα. Ζητήστε προσφορά για ακριβή εκτίμηση.",
      },
      {
        q: "Πόσο διαρκεί η διαδικασία;",
        a: "2-6 εβδομάδες ανάλογα με το πεδίο. Τα πρωτότυπα είναι έτοιμα σε 1-2 εβδομάδες.",
      },
    ],
    ctaTitle: "Θέλετε brand που ξεχωρίζει;",
    ctaDesc:
      "Ζητήστε δωρεάν εκτίμηση για UX/UI design και branding.",
  },
  "digital-marketing": {
    slug: "digital-marketing",
    icon: "📈",
    heroTitle: "Performance Marketing & Διαφήμιση με Μετρήσιμο ROI",
    heroSubtitle:
      "Αυξήστε τις πωλήσεις και τα leads σας. Σχεδιάζουμε και εκτελούμε στοχευμένες καμπάνιες.",
    heroTagline: "Κάθε ευρώ επιστρέφει μετρήσιμα.",
    whyTitle: "Γιατί η διαφήμιση πρέπει να μετριέται",
    whyText:
      "Κάθε ευρώ που δαπανάτε στη διαφήμιση πρέπει να επιστρέφει. Εστιάζουμε σε μετρήσιμα αποτελέσματα, όχι likes.",
    benefits: [
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
      {
        title: "Content Marketing & Blog Strategy",
        desc: "Περιεχόμενο που ελκύει οργανική κίνηση και ενισχύει την αξιοπιστία.",
      },
      {
        title: "Email Marketing Automation",
        desc: "Αυτοματοποιημένες ροές email για lead nurturing και retention.",
      },
    ],
    offerings: [
      {
        title: "Τι περιλαμβάνει",
        items: [
          "Ανάλυση ανταγωνισμού & αγοράς",
          "Στρατηγική διαφημίσεων",
          "Δημιουργία διαφημιστικού",
          "Διαχείριση καμπανιών",
          "Weekly reports & analytics",
          "A/B testing διαφημίσεων",
          "ROI tracking & reporting",
        ],
      },
    ],
    audience: [
      "E-shop που θέλουν περισσότερες πωλήσεις",
      "Επιχειρήσεις υπηρεσιών",
      "Νέες επιχειρήσεις",
      "Brands που θέλουν brand awareness",
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
      {
        q: "Πόσο γρήγορα βλέπω αποτελέσματα;",
        a: "Google Ads: άμεσα. Meta Ads: 3-7 ημέρες. SEO: 3-6 μήνες.",
      },
    ],
    ctaTitle: "Θέλετε μετρήσιμα αποτελέσματα από τη διαφήμιση;",
    ctaDesc:
      "Ζητήστε δωρεάν ανάλυση καμπάνιας και στρατηγική.",
  },
  "web-mobile-apps": {
    slug: "web-mobile-apps",
    icon: "📱",
    heroTitle: "Custom Web & Mobile Εφαρμογές (SaaS & Portals)",
    heroSubtitle:
      "Μετατρέψτε την ιδέα σας σε λειτουργικό λογισμικό. Αναπτύσσουμε κλιμακώσιμες πλατφόρμες.",
    heroTagline: "Από την ιδέα στο λογισμικό.",
    whyTitle: "Γιατί custom λογισμικό ανταποκρίνεται στις ανάγκες σας",
    whyText:
      "Η ιδέα σας χρειάζεται λογισμικό που κλιμακώνεται. Αναπτύσσουμε SaaS, portals και mobile apps που αντέχουν σε χιλιάδες χρήστες.",
    benefits: [
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
      {
        title: "API-first Design",
        desc: "Αρχιτεκτονική API που επιτρέπει εύκολη ενσωμάτωση τρίτων.",
      },
      {
        title: "CI/CD & DevOps",
        desc: "Αυτοματοποιημένο deployment pipeline για γρήγορες αναβαθμίσεις.",
      },
    ],
    offerings: [
      {
        title: "Τι περιλαμβάνει",
        items: [
          "Ανάλυση απαιτήσεων & MVP definition",
          "System architecture design",
          "Frontend ανάπτυξη (React/Next.js)",
          "Backend ανάπτυξη (Node.js/Python)",
          "Mobile app (React Native)",
          "Testing & QA",
          "Deployment & monitoring",
        ],
      },
    ],
    audience: [
      "Startups",
      "Επιχειρήσεις με custom ανάγκες",
      "Οργανισμοί που θέλουν SaaS",
      "Ανάγκη για internal tools",
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
      {
        q: "Πόσο χρόνο χρειάζεται;",
        a: "MVP: 6-10 εβδομάδες. Full app: 3-6 μήνες ανάλογα με πολυπλοκότητα.",
      },
    ],
    ctaTitle: "Έχετε μια ιδέα για app;",
    ctaDesc:
      "Ζητήστε δωρεάν εκτίμηση για την ανάπτυξη της εφαρμογής σας.",
  },
  "hosting-support": {
    slug: "hosting-support",
    icon: "🛡️",
    heroTitle: "Συνεχής Τεχνική Υποστήριξη & Managed Cloud Hosting",
    heroSubtitle:
      "Εγγυημένη διαθεσιμότητα 99.9% και απόλυτη ασφάλεια. Αναλαμβάνουμε τη συντήρηση 24/7.",
    heroTagline: "Εμείς φροντίζουμε, εσείς εστιάζετε.",
    whyTitle: "Γιατί η υποστήριξη δεν είναι πολυτέλεια",
    whyText:
      "Το site σας πρέπει να είναι πάντα online και ασφαλές. Εμείς αναλαμβάνουμε τη συντήρηση ενώ εσείς εστιάζετε στη δουλειά σας.",
    benefits: [
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
      {
        title: "SSL Certificates & Domain Management",
        desc: "Διαχείριση domains, SSL και DNS records.",
      },
      {
        title: "Performance Optimization",
        desc: "Τακτική βελτιστοποίηση ταχύτητας και caching strategy.",
      },
    ],
    offerings: [
      {
        title: "Τι περιλαμβάνει",
        items: [
          "Managed cloud hosting",
          "Καθημερινά backups",
          "Security patching & WAF",
          "24/7 monitoring",
          "SSL & domain management",
          "Performance optimization",
          "Emergency support",
          "Monthly reports",
        ],
      },
    ],
    audience: [
      "Ιστοσελίδες υψηλής κίνησης",
      "E-shop",
      "Εταιρικές ιστοσελίδες",
      "Εφαρμογές με 24/7 λειτουργία",
    ],
    faqs: [
      {
        q: "Τι περιλαμβάνει η υποστήριξη;",
        a: "Αναβαθμίσεις, backup, monitoring, ασφάλεια και άμεση τεχνική βοήθεια.",
      },
      {
        q: "Πόσο κοστίζει το hosting;",
        a: "Από €50/μήνα ανάλογα με τις ανάγκες. Ζητήστε προσφορά.",
      },
      {
        q: "Πόσο γρήγορα απαντάτε σε βλάβη;",
        a: "Κρίσιμες βλάβες: εντός 1 ώρας. Μη-κρίσιμες: εντός 4 ωρών.",
      },
    ],
    ctaTitle: "Θέλετε ασφαλές και γρήγορο hosting;",
    ctaDesc:
      "Ζητήστε πληροφορίες για managed hosting και υποστήριξη.",
  },
  "custom-integrations": {
    slug: "custom-integrations",
    icon: "⚙️",
    heroTitle: "Custom Ανάπτυξη Λογισμικού & Ενσωματώσεις APIs",
    heroSubtitle:
      "Συνδέστε όλα τα επιχειρησιακά σας εργαλεία σε ένα ενιαίο οικοσύστημα.",
    heroTagline: "Τα εργαλεία σας, ενωμένα.",
    whyTitle: "Γιατί οι ενσωματώσεις αυξάνουν την αποδοτικότητα",
    whyText:
      "Τα εργαλεία σας δεν μιλάνε μεταξύ τους. Εμείς τα συνδέουμε — API integrations, CRM/ERP sync και AI αυτοματοποιήσεις.",
    benefits: [
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
      {
        title: "Webhook & Event-driven Architecture",
        desc: "Real-time ενημέρωση μεταξύ συστημάτων μέσω events.",
      },
      {
        title: "Security & Compliance",
        desc: "OAuth 2.0, API keys, rate limiting και logging για ασφαλείς ενσωματώσεις.",
      },
    ],
    offerings: [
      {
        title: "Τι περιλαμβάνει",
        items: [
          "Ανάλυση υπαρχόντων συστημάτων",
          "API design & development",
          "CRM/ERP διασύνδεση",
          "AI agent ανάπτυξη",
          "ETL pipelines",
          "Testing & documentation",
          "Monitoring & logging",
        ],
      },
    ],
    audience: [
      "Επιχειρήσεις με πολλαπλά συστήματα",
      "Οργανισμοί που χρειάζονται αυτοματοποίηση",
      "Εταιρίες με legacy συστήματα",
      "Startups που χρειάζονται AI integrations",
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
      {
        q: "Πόσο χρόνο χρειάζεται;",
        a: "Από 2 εβδομάδες για απλή ενσωμάτωση έως 3 μήνες για πολύπλοκο σύστημα.",
      },
    ],
    ctaTitle: "Χρειάζεστε ενσωμάτωση συστημάτων;",
    ctaDesc:
      "Ζητήστε δωρεάν ανάλυση και πρόταση για τις ενσωματώσεις σας.",
  },
};

export const servicesList = Object.values(servicesData);
