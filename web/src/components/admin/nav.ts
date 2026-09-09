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
  | "settings"
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
    label: "Command Center",
    icon: LayoutDashboard,
    accent: "#2f5fd8",
    items: [
      { key: "dashboard", label: "Dashboard", state: "live", icon: LayoutDashboard, tab: "dashboard", description: "Command Center — ζωντανά KPIs, κίνδυνοι και επόμενη ενέργεια από πραγματικά δεδομένα." },
      { key: "attention", label: "My Attention", state: "live", icon: BellRing, tab: "attention", description: "Τι χρειάζεται την προσοχή σου τώρα — από πραγματικά δεδομένα." },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    icon: UsersRound,
    accent: "#7c3aed",
    items: [
      { key: "leads", label: "Leads", state: "live", icon: UserRoundPlus, tab: "leads", description: "Διαχείριση leads με πραγματικά δεδομένα." },
      { key: "people", label: "People", state: "planned", icon: UserRound, description: "Μελλοντική ενοποίηση πελατών/επαφών. " + PLANNED_EXAMPLE },
      { key: "companies", label: "Companies", state: "planned", icon: Building2, description: "Επιχειρήσεις & οργανισμοί ως οντότητες. " + PLANNED_EXAMPLE },
      { key: "customers", label: "Customers", state: "beta", icon: UserCheck, tab: "customers", description: "Καρτέλα 360° πελάτη — πραγματικά δεδομένα από leads, deals, τιμολόγια, επικοινωνίες." },
      { key: "referrals", label: "Referrals", state: "planned", icon: Share2, description: "Παραπομπές. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: TrendingUp,
    accent: "#16a34a",
    items: [
      { key: "pipeline", label: "Pipeline", state: "live", icon: KanbanSquare, tab: "pipeline", description: "Pipeline πραγματικών deals." },
      { key: "quotes", label: "Quotes", state: "planned", icon: FileText, description: "Προσφορές. " + PLANNED_EXAMPLE },
      { key: "contracts", label: "Contracts", state: "planned", icon: FileCheck2, description: "Συμβόλαια. " + PLANNED_EXAMPLE },
      { key: "forecast", label: "Forecast", state: "planned", icon: ChartNoAxesCombined, description: "Πρόβλεψη εσόδων. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "energy",
    label: "Energy",
    icon: Zap,
    accent: "#d97706",
    items: [
      { key: "renewals", label: "Renewals", state: "live", icon: RefreshCw, tab: "renewals", description: "Ανανεώσεις συμβολαίων — πραγματικά δεδομένα από το σύστημα ανανεώσεων." },
      { key: "customers-energy", label: "Customers", state: "planned", icon: UsersRound, description: "Ενεργειακοί πελάτες. " + PLANNED_EXAMPLE },
      { key: "bills", label: "Bills", state: "planned", icon: ReceiptText, description: "Λογαριασμοί. " + PLANNED_EXAMPLE },
      { key: "providers", label: "Providers", state: "planned", icon: Building2, description: "Πάροχοι. " + PLANNED_EXAMPLE },
      { key: "comparisons", label: "Comparisons", state: "planned", icon: GitCompare, description: "Συγκρίσεις. " + PLANNED_EXAMPLE },
      { key: "switches", label: "Switches", state: "planned", icon: ArrowLeftRight, description: "Αλλαγές παρόχου. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "insurance",
    label: "Insurance",
    icon: ShieldCheck,
    accent: "#e11d48",
    items: [
      { key: "policies", label: "Policies", state: "planned", icon: ShieldCheck, description: "Ασφαλιστικά συμβόλαια. " + PLANNED_EXAMPLE },
      { key: "insurance-products", label: "Products", state: "planned", icon: Package, description: "Ασφαλιστικά προϊόντα. " + PLANNED_EXAMPLE },
      { key: "insurance-renewals", label: "Renewals", state: "planned", icon: RefreshCw, description: "Ανανεώσεις ασφαλειών. " + PLANNED_EXAMPLE },
      { key: "compliance", label: "Compliance", state: "planned", icon: ShieldAlert, description: "Ρυθμιστική συμμόρφωση. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "web",
    label: "Web & Digital",
    icon: MonitorCog,
    accent: "#0891b2",
    items: [
      { key: "projects", label: "Projects", state: "planned", icon: PanelsTopLeft, description: "Web έργα. " + PLANNED_EXAMPLE },
      { key: "hosting", label: "Hosting", state: "planned", icon: CloudCog, description: "Hosting & domains. " + PLANNED_EXAMPLE },
      { key: "maintenance", label: "Maintenance", state: "planned", icon: Wrench, description: "Συντήρηση. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    accent: "#9333ea",
    items: [
      { key: "creative", label: "Creative Studio", state: "live", icon: WandSparkles, href: "/admin/creative", description: "Δημιουργία εικόνων + κειμένων με AI (πραγματικές ροές)." },
      { key: "campaigns", label: "Campaigns", state: "planned", icon: Megaphone, description: "Καμπάνιες. " + PLANNED_EXAMPLE },
      { key: "media", label: "Media Library", state: "planned", icon: Images, description: "Βιβλιοθήκη μέσων. " + PLANNED_EXAMPLE },
      { key: "content-calendar", label: "Content Calendar", state: "planned", icon: CalendarDays, description: "Ημερολόγιο περιεχομένου. " + PLANNED_EXAMPLE },
      { key: "social-inbox", label: "Social Inbox", state: "planned", icon: MessagesSquare, description: "Κοινωνικά μηνύματα & σχόλια. " + PLANNED_EXAMPLE },
      { key: "seo", label: "SEO", state: "planned", icon: SearchCheck, description: "SEO. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "comms",
    label: "Communications",
    icon: MessagesSquare,
    accent: "#2563eb",
    items: [
      { key: "comms", label: "Communications", state: "live", icon: MessageCircle, tab: "comms", description: "Χρονολόγιο επικοινωνιών (email/κλήσεις/σημειώσεις)." },
      { key: "inbox", label: "Unified Inbox", state: "planned", icon: Inbox, description: "Ενοποιημένο inbox. " + PLANNED_EXAMPLE },
      { key: "whatsapp", label: "WhatsApp", state: "planned", icon: MessageCircle, description: "WhatsApp. " + PLANNED_EXAMPLE },
      { key: "viber", label: "Viber", state: "planned", icon: PhoneCall, description: "Viber. " + PLANNED_EXAMPLE },
      { key: "sms", label: "SMS", state: "planned", icon: MessageSquare, description: "SMS. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    icon: CalendarCheck,
    accent: "#4f46e5",
    items: [
      { key: "calendar", label: "Calendar & Tasks", state: "live", icon: CalendarCheck2, tab: "calendar", description: "Ημερολόγιο + εργασίες (tasks/reminders)." },
      { key: "documents", label: "Documents", state: "planned", icon: Files, description: "Έγγραφα. " + PLANNED_EXAMPLE },
      { key: "workflows", label: "Workflows", state: "planned", icon: Workflow, description: "Ροές εργασίας. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: WalletCards,
    accent: "#059669",
    items: [
      { key: "invoices", label: "Invoices", state: "live", icon: Receipt, tab: "invoices", description: "Τιμολόγια με πραγματικά δεδομένα." },
      { key: "payments", label: "Payments", state: "planned", icon: CreditCard, description: "Πληρωμές. " + PLANNED_EXAMPLE },
      { key: "commissions", label: "Commissions", state: "planned", icon: Coins, description: "Προμήθειες. " + PLANNED_EXAMPLE },
      { key: "revenue", label: "Revenue", state: "planned", icon: BadgeEuro, description: "Έσοδα. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "ai",
    label: "AI / JARVIS",
    icon: Bot,
    accent: "#7c3aed",
    items: [
      { key: "ai", label: "JARVIS", state: "live", icon: Bot, tab: "ai", description: "Ο βοηθός AI με πραγματικές εντολές και εγκρίσεις." },
      { key: "agent-runs", label: "Agent Runs", state: "planned", icon: Workflow, description: "Εκτελέσεις agents. " + PLANNED_EXAMPLE },
      { key: "approvals", label: "Approvals", state: "planned", icon: BadgeCheck, description: "Εγκρίσεις με βάση πολιτικών. " + PLANNED_EXAMPLE },
      { key: "knowledge", label: "Knowledge", state: "planned", icon: BookOpen, description: "Γνωσιακή βάση. " + PLANNED_EXAMPLE },
      { key: "policies", label: "Policies", state: "planned", icon: ShieldCheck, description: "Πολιτικές. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: BrainCircuit,
    accent: "#0ea5e9",
    items: [
      { key: "analytics", label: "Analytics", state: "live", icon: ChartNoAxesCombined, tab: "analytics", description: "Αναλυτικά από πραγματικά δεδομένα." },
      { key: "kpis", label: "KPIs", state: "planned", icon: Gauge, description: "Στόχοι & KPI. " + PLANNED_EXAMPLE },
      { key: "forecasts", label: "Forecasts", state: "planned", icon: TrendingUp, description: "Προβλέψεις. " + PLANNED_EXAMPLE },
      { key: "customer-health", label: "Customer Health", state: "planned", icon: HeartPulse, description: "Υγεία πελατών. " + PLANNED_EXAMPLE },
      { key: "churn-risk", label: "Churn Risk", state: "planned", icon: UserRoundX, description: "Κίνδυνος απώλειας. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    icon: Settings2,
    accent: "#64748b",
    items: [
      { key: "notifications", label: "Notifications", state: "live", icon: Bell, tab: "notifications", description: "Ειδοποιήσεις συστήματος." },
      { key: "social-accounts", label: "Social Accounts", state: "live", icon: Share2, href: "/admin/social", description: "Συνδεδεμένοι λογαριασμοί social media." },
      { key: "settings", label: "Settings", state: "live", icon: Settings2, tab: "settings", description: "Ρυθμίσεις συστήματος." },
      { key: "users", label: "Users", state: "planned", icon: UsersRound, description: "Χρήστες. " + PLANNED_EXAMPLE },
      { key: "integrations", label: "Integrations", state: "planned", icon: PlugZap, description: "Ενσωματώσεις. " + PLANNED_EXAMPLE },
      { key: "audit-log", label: "Audit Log", state: "planned", icon: ClipboardCheck, description: "Ημερολόγιο ενεργειών. " + PLANNED_EXAMPLE },
      { key: "system-health", label: "System Health", state: "planned", icon: Activity, description: "Υγεία συστήματος. " + PLANNED_EXAMPLE },
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