// ── Atlas IA navigation model (shared by AdminShell + CRM) ──────────────────
// Groups mirror the master architecture. Each item carries an honest module
// state so JARVIS and the owner are never tricked into thinking a module works
// when it does not. LIVE items route to real working surfaces; PLANNED items
// open an informative placeholder panel (no fake counts or dashboards).
//
// Icons: the single central map for the whole shell. Category icons use a
// stronger colored tile; child icons stay monochrome and quiet. No page should
// re-declare these mappings.

import {
  Activity,
  ArrowLeftRight,
  BadgeCheck,
  BadgeEuro,
  Bell,
  BellRing,
  BookOpen,
  Bot,
  BrainCircuit,
  Building2,
  CalendarCheck,
  CalendarCheck2,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  CloudCog,
  Coins,
  CreditCard,
  FileCheck2,
  FileText,
  Files,
  Gauge,
  GitCompare,
  HeartPulse,
  Images,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  MessageSquare,
  MonitorCog,
  Package,
  PanelsTopLeft,
  PhoneCall,
  PlugZap,
  Receipt,
  ReceiptText,
  RefreshCw,
  SearchCheck,
  Settings2,
  Share2,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserRound,
  UserRoundPlus,
  UserRoundX,
  UsersRound,
  WalletCards,
  WandSparkles,
  Workflow,
  Wrench,
  Zap,
  Orbit,
  type LucideIcon,
} from "lucide-react";

export type ModState = "live" | "beta" | "planned" | "disabled";

export type CrmTab =
  | "dashboard"
  | "attention"
  | "leads"
  | "customers"
  | "pipeline"
  | "calendar"
  | "comms"
  | "invoices"
  | "analytics"
  | "notifications"
  | "renewals"
  | "ai"
  | "survivor"
  | "settings"
  | "preferences"
  | "planned";

export interface NavItem {
  key: string;
  label: string;
  state: ModState;
  icon: LucideIcon;
  tab?: CrmTab;
  href?: string;
  description: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Restrained category accent used for the icon tile (hex). */
  accent: string;
  items: NavItem[];
}

export const DEFAULT_TAB: CrmTab = "dashboard";
export const PLANNED_EXAMPLE = "Not built yet — no fabricated data is displayed here.";

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "command",
    label: "Αρχική",
    icon: LayoutDashboard,
    accent: "#5b8def",
    items: [
      { key: "dashboard", label: "Επισκόπηση", state: "live", icon: LayoutDashboard, tab: "dashboard", description: "Η συνολική εικόνα της ημέρας, με πραγματικά δεδομένα." },
      { key: "attention", label: "Τι χρειάζεται προσοχή", state: "live", icon: BellRing, tab: "attention", description: "Τα σημαντικότερα θέματα που χρειάζονται ενέργεια." },
    ],
  },
  {
    id: "crm",
    label: "Πελάτες & Πωλήσεις",
    icon: UsersRound,
    accent: "#8b7cf6",
    items: [
      { key: "leads", label: "Leads", state: "live", icon: UserRoundPlus, tab: "leads", description: "Διαχείριση νέων υποψήφιων πελατών." },
      { key: "customers", label: "Πελάτες 360°", state: "beta", icon: UserCheck, tab: "customers", description: "Ενιαία καρτέλα πελάτη με αιτήματα, συναλλαγές και επικοινωνίες." },
      { key: "people", label: "Επαφές", state: "planned", icon: UserRound, description: "Μελλοντική ενοποίηση πελατών και επαφών. " + PLANNED_EXAMPLE },
      { key: "companies", label: "Εταιρείες", state: "planned", icon: Building2, description: "Επιχειρήσεις και οργανισμοί ως οντότητες. " + PLANNED_EXAMPLE },
      { key: "referrals", label: "Συστάσεις", state: "planned", icon: Share2, description: "Παρακολούθηση συστάσεων. " + PLANNED_EXAMPLE },
      { key: "pipeline", label: "Pipeline πωλήσεων", state: "live", icon: KanbanSquare, tab: "pipeline", description: "Τα πραγματικά deals ανά στάδιο πώλησης." },
      { key: "quotes", label: "Προσφορές", state: "planned", icon: FileText, description: "Δημιουργία και παρακολούθηση προσφορών. " + PLANNED_EXAMPLE },
      { key: "contracts", label: "Συμβόλαια", state: "planned", icon: FileCheck2, description: "Διαχείριση συμβολαίων. " + PLANNED_EXAMPLE },
      { key: "forecast", label: "Πρόβλεψη πωλήσεων", state: "planned", icon: ChartNoAxesCombined, description: "Πρόβλεψη εσόδων και πωλήσεων. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "services",
    label: "Υπηρεσίες",
    icon: Zap,
    accent: "#d49b36",
    items: [
      { key: "renewals", label: "Ανανεώσεις ενέργειας", state: "live", icon: RefreshCw, tab: "renewals", description: "Ανανεώσεις συμβολαίων από τα πραγματικά στοιχεία πελατών." },
      { key: "customers-energy", label: "Ενεργειακοί πελάτες", state: "planned", icon: UsersRound, description: "Εξειδικευμένη εικόνα ενεργειακών πελατών. " + PLANNED_EXAMPLE },
      { key: "bills", label: "Λογαριασμοί", state: "planned", icon: ReceiptText, description: "Παρακολούθηση λογαριασμών. " + PLANNED_EXAMPLE },
      { key: "providers", label: "Πάροχοι", state: "planned", icon: Building2, description: "Κατάλογος παρόχων. " + PLANNED_EXAMPLE },
      { key: "comparisons", label: "Συγκρίσεις", state: "planned", icon: GitCompare, description: "Συγκρίσεις προγραμμάτων. " + PLANNED_EXAMPLE },
      { key: "switches", label: "Αλλαγές παρόχου", state: "planned", icon: ArrowLeftRight, description: "Παρακολούθηση αλλαγών παρόχου. " + PLANNED_EXAMPLE },
      { key: "policies", label: "Ασφαλιστήρια", state: "planned", icon: ShieldCheck, description: "Διαχείριση ασφαλιστηρίων. " + PLANNED_EXAMPLE },
      { key: "insurance-products", label: "Ασφαλιστικά προϊόντα", state: "planned", icon: Package, description: "Κατάλογος ασφαλιστικών προϊόντων. " + PLANNED_EXAMPLE },
      { key: "insurance-renewals", label: "Ανανεώσεις ασφαλειών", state: "planned", icon: RefreshCw, description: "Ανανεώσεις ασφαλιστηρίων. " + PLANNED_EXAMPLE },
      { key: "compliance", label: "Συμμόρφωση", state: "planned", icon: ShieldAlert, description: "Έλεγχοι κανονιστικής συμμόρφωσης. " + PLANNED_EXAMPLE },
      { key: "projects", label: "Ψηφιακά έργα", state: "planned", icon: PanelsTopLeft, description: "Παρακολούθηση έργων web και software. " + PLANNED_EXAMPLE },
      { key: "hosting", label: "Hosting & Domains", state: "planned", icon: CloudCog, description: "Hosting, domains και υποδομές. " + PLANNED_EXAMPLE },
      { key: "maintenance", label: "Συντήρηση", state: "planned", icon: Wrench, description: "Συντήρηση ψηφιακών έργων. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "work",
    label: "Επικοινωνία & Εργασίες",
    icon: CalendarCheck,
    accent: "#4f77c9",
    items: [
      { key: "comms", label: "Επικοινωνίες", state: "live", icon: MessageCircle, tab: "comms", description: "Χρονολόγιο email, κλήσεων και σημειώσεων." },
      { key: "calendar", label: "Ημερολόγιο & Tasks", state: "live", icon: CalendarCheck2, tab: "calendar", description: "Ημερολόγιο, εργασίες και υπενθυμίσεις." },
      { key: "inbox", label: "Ενιαία εισερχόμενα", state: "planned", icon: Inbox, description: "Ενοποιημένο inbox. " + PLANNED_EXAMPLE },
      { key: "whatsapp", label: "WhatsApp", state: "planned", icon: MessageCircle, description: "Επικοινωνία WhatsApp. " + PLANNED_EXAMPLE },
      { key: "viber", label: "Viber", state: "planned", icon: PhoneCall, description: "Επικοινωνία Viber. " + PLANNED_EXAMPLE },
      { key: "sms", label: "SMS", state: "planned", icon: MessageSquare, description: "Αποστολή SMS. " + PLANNED_EXAMPLE },
      { key: "documents", label: "Έγγραφα", state: "planned", icon: Files, description: "Κεντρική διαχείριση εγγράφων. " + PLANNED_EXAMPLE },
      { key: "workflows", label: "Αυτοματισμοί ροών", state: "planned", icon: Workflow, description: "Ροές εργασίας και αυτοματισμοί. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "finance",
    label: "Οικονομικά",
    icon: WalletCards,
    accent: "#259b76",
    items: [
      { key: "invoices", label: "Τιμολόγια", state: "live", icon: Receipt, tab: "invoices", description: "Πραγματικά τιμολόγια και οικονομικές εκκρεμότητες." },
      { key: "payments", label: "Πληρωμές", state: "planned", icon: CreditCard, description: "Παρακολούθηση πληρωμών. " + PLANNED_EXAMPLE },
      { key: "commissions", label: "Προμήθειες", state: "planned", icon: Coins, description: "Υπολογισμός προμηθειών. " + PLANNED_EXAMPLE },
      { key: "revenue", label: "Έσοδα", state: "planned", icon: BadgeEuro, description: "Οικονομική εικόνα εσόδων. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    accent: "#a36dd6",
    items: [
      { key: "creative", label: "Creative Studio", state: "live", icon: WandSparkles, href: "/admin/creative", description: "Δημιουργία εικόνων και κειμένων με AI." },
      { key: "campaigns", label: "Καμπάνιες", state: "planned", icon: Megaphone, description: "Καμπάνιες marketing. " + PLANNED_EXAMPLE },
      { key: "media", label: "Βιβλιοθήκη αρχείων", state: "planned", icon: Images, description: "Βιβλιοθήκη εικόνων και μέσων. " + PLANNED_EXAMPLE },
      { key: "content-calendar", label: "Ημερολόγιο περιεχομένου", state: "planned", icon: CalendarDays, description: "Προγραμματισμός περιεχομένου. " + PLANNED_EXAMPLE },
      { key: "social-inbox", label: "Social Inbox", state: "planned", icon: MessagesSquare, description: "Μηνύματα και σχόλια social. " + PLANNED_EXAMPLE },
      { key: "seo", label: "SEO", state: "planned", icon: SearchCheck, description: "Εργαλεία SEO. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "ai",
    label: "AI & Αναλύσεις",
    icon: Bot,
    accent: "#8972d9",
    items: [
      { key: "ai", label: "JARVIS", state: "live", icon: Bot, tab: "ai", description: "AI βοηθός με εντολές και εγκρίσεις υπό ανθρώπινη εποπτεία." },
      { key: "analytics", label: "Αναλυτικά στοιχεία", state: "live", icon: ChartNoAxesCombined, tab: "analytics", description: "Αναφορές και αναλύσεις από πραγματικά δεδομένα." },
      { key: "agent-runs", label: "Εκτελέσεις AI", state: "planned", icon: Workflow, description: "Ιστορικό εκτελέσεων agents. " + PLANNED_EXAMPLE },
      { key: "approvals", label: "Εγκρίσεις", state: "planned", icon: BadgeCheck, description: "Κεντρική διαχείριση εγκρίσεων. " + PLANNED_EXAMPLE },
      { key: "knowledge", label: "Γνωσιακή βάση", state: "planned", icon: BookOpen, description: "Γνωσιακή βάση και αναζήτηση. " + PLANNED_EXAMPLE },
      { key: "policies", label: "Πολιτικές AI", state: "planned", icon: ShieldCheck, description: "Πολιτικές και όρια AI. " + PLANNED_EXAMPLE },
      { key: "survivor", label: "AI Survivor", state: "live", icon: Orbit, tab: "survivor", description: "Sandbox με wallet, προτάσεις, εγκρίσεις, εργασίες και μάθηση." },
      { key: "survivor-simulation", label: "Προσομοιώσεις", state: "planned", icon: Workflow, description: "Πειράματα και προσομοιώσεις. " + PLANNED_EXAMPLE },
      { key: "survivor-memory", label: "Μνήμη Survivor", state: "planned", icon: BrainCircuit, description: "Μνήμη και μαθήματα. " + PLANNED_EXAMPLE },
      { key: "kpis", label: "Στόχοι & KPIs", state: "planned", icon: Gauge, description: "Στόχοι και KPIs. " + PLANNED_EXAMPLE },
      { key: "forecasts", label: "Προβλέψεις", state: "planned", icon: TrendingUp, description: "Προβλέψεις απόδοσης. " + PLANNED_EXAMPLE },
      { key: "customer-health", label: "Υγεία πελατών", state: "planned", icon: HeartPulse, description: "Δείκτες υγείας πελατών. " + PLANNED_EXAMPLE },
      { key: "churn-risk", label: "Κίνδυνος αποχώρησης", state: "planned", icon: UserRoundX, description: "Έγκαιρος εντοπισμός κινδύνου απώλειας πελατών. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "admin",
    label: "Διαχείριση",
    icon: Settings2,
    accent: "#8290a5",
    items: [
      { key: "notifications", label: "Ειδοποιήσεις", state: "live", icon: Bell, tab: "notifications", description: "Ειδοποιήσεις συστήματος." },
      { key: "social-accounts", label: "Συνδεδεμένοι λογαριασμοί", state: "live", icon: Share2, href: "/admin/social", description: "Συνδεδεμένοι λογαριασμοί social media." },
      { key: "settings", label: "Ρυθμίσεις συστήματος", state: "live", icon: Settings2, tab: "settings", description: "Ρυθμίσεις εταιρείας, AI, επικοινωνίας και αναφορών." },
      { key: "preferences", label: "Προσαρμογή CRM", state: "live", icon: MonitorCog, tab: "preferences", description: "Εμφάνιση και διάταξη της προσωπικής αρχικής σελίδας." },
      { key: "users", label: "Χρήστες & Ρόλοι", state: "planned", icon: UsersRound, description: "Διαχείριση χρηστών και δικαιωμάτων. " + PLANNED_EXAMPLE },
      { key: "integrations", label: "Ενσωματώσεις", state: "planned", icon: PlugZap, description: "Συνδέσεις εξωτερικών υπηρεσιών. " + PLANNED_EXAMPLE },
      { key: "audit-log", label: "Ιστορικό ενεργειών", state: "planned", icon: ClipboardCheck, description: "Αναλυτικό αρχείο ενεργειών. " + PLANNED_EXAMPLE },
      { key: "system-health", label: "Κατάσταση συστήματος", state: "planned", icon: Activity, description: "Παρακολούθηση υγείας συστήματος. " + PLANNED_EXAMPLE },
    ],
  },
];

// Columns in NAV_GROUPS are only serialization-friendly (key/label/href/tab/state);
// icon/accent are components/colors consumed by the shell.
export const NAV_KEY_TO_TAB: Record<string, CrmTab> = {};
for (const g of NAV_GROUPS) for (const it of g.items) if (it.tab) NAV_KEY_TO_TAB[it.key] = it.tab;

export function liveTabs(): CrmTab[] {
  const out: CrmTab[] = [];
  for (const g of NAV_GROUPS) {
    for (const it of g.items) {
      if ((it.state === "live" || it.state === "beta") && it.tab) out.push(it.tab);
    }
  }
  return out;
}

// Resolves the ?tab= URL param to a valid CRM tab, honoring the planned-module
// pseudo-tab only when a module key is present in the URL.
export function resolveCrmTab(raw: string | null, moduleKey: string | null): CrmTab {
  if (raw === "planned" && moduleKey) return "planned";
  if (raw && (liveTabs() as string[]).includes(raw)) return raw as CrmTab;
  return DEFAULT_TAB;
}

export function plannedModuleByKey(
  key: string | null
): { label: string; description: string } | null {
  if (!key) return null;
  for (const g of NAV_GROUPS) {
    for (const it of g.items) {
      if (it.key === key && it.state === "planned") {
        return { label: it.label, description: it.description };
      }
    }
  }
  return null;
}

// The group that contains a given nav key (used to auto-open the active group).
export function groupByItemKey(key: string): NavGroup | null {
  for (const g of NAV_GROUPS) {
    for (const it of g.items) if (it.key === key) return g;
  }
  return null;
}