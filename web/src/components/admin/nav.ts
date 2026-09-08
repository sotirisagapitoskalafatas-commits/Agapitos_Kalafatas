// ── Atlas IA navigation model (shared by AdminShell + CRM) ──────────────────
// Groups mirror the master architecture. Each item carries an honest module
// state so JARVIS and the owner are never tricked into thinking a module works
// when it does not. LIVE items route to real working surfaces; PLANNED items
// open an informative placeholder panel (no fake counts or dashboards).

export type ModState = "live" | "beta" | "planned" | "disabled";

export type CrmTab =
  | "dashboard"
  | "leads"
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
  tab?: CrmTab;
  href?: string;
  description: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const DEFAULT_TAB: CrmTab = "dashboard";
export const PLANNED_EXAMPLE = "Not built yet — no fabricated data is displayed here.";

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "command",
    label: "Command Center",
    items: [
      { key: "dashboard", label: "Dashboard", state: "live", tab: "dashboard", description: "Σύνοψη των KPIs του CRM με πραγματικά δεδομένα." },
    ],
  },
  {
    id: "crm",
    label: "CRM",
    items: [
      { key: "leads", label: "Leads", state: "live", tab: "leads", description: "Διαχείριση leads με πραγματικά δεδομένα." },
      { key: "people", label: "People", state: "planned", description: "Μελλοντική ενοποίηση πελατών/επαφών. " + PLANNED_EXAMPLE },
      { key: "companies", label: "Companies", state: "planned", description: "Επιχειρήσεις & οργανισμοί ως οντότητες. " + PLANNED_EXAMPLE },
      { key: "customers", label: "Customers", state: "planned", description: "Καρτέλα 360° πελάτη. " + PLANNED_EXAMPLE },
      { key: "referrals", label: "Referrals", state: "planned", description: "Παραπομπές. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { key: "pipeline", label: "Pipeline", state: "live", tab: "pipeline", description: "Pipeline πραγματικών deals." },
      { key: "quotes", label: "Quotes", state: "planned", description: "Προσφορές. " + PLANNED_EXAMPLE },
      { key: "contracts", label: "Contracts", state: "planned", description: "Συμβόλαια. " + PLANNED_EXAMPLE },
      { key: "forecast", label: "Forecast", state: "planned", description: "Πρόβλεψη εσόδων. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "energy",
    label: "Energy",
    items: [
      { key: "renewals", label: "Renewals", state: "live", tab: "renewals", description: "Ανανεώσεις συμβολαίων — πραγματικά δεδομένα από το σύστημα ανανεώσεων." },
      { key: "customers-energy", label: "Customers", state: "planned", description: "Ενεργειακοί πελάτες. " + PLANNED_EXAMPLE },
      { key: "bills", label: "Bills", state: "planned", description: "Λογαριασμοί. " + PLANNED_EXAMPLE },
      { key: "providers", label: "Providers", state: "planned", description: "Πάροχοι. " + PLANNED_EXAMPLE },
      { key: "comparisons", label: "Comparisons", state: "planned", description: "Συγκρίσεις. " + PLANNED_EXAMPLE },
      { key: "switches", label: "Switches", state: "planned", description: "Αλλαγές παρόχου. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "insurance",
    label: "Insurance",
    items: [
      { key: "policies", label: "Policies", state: "planned", description: "Ασφαλιστικά συμβόλαια. " + PLANNED_EXAMPLE },
      { key: "insurance-products", label: "Products", state: "planned", description: "Ασφαλιστικά προϊόντα. " + PLANNED_EXAMPLE },
      { key: "insurance-renewals", label: "Renewals", state: "planned", description: "Ανανεώσεις ασφαλειών. " + PLANNED_EXAMPLE },
      { key: "compliance", label: "Compliance", state: "planned", description: "Ρυθμιστική συμμόρφωση. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "web",
    label: "Web & Digital",
    items: [
      { key: "projects", label: "Projects", state: "planned", description: "Web έργα. " + PLANNED_EXAMPLE },
      { key: "hosting", label: "Hosting", state: "planned", description: "Hosting & domains. " + PLANNED_EXAMPLE },
      { key: "maintenance", label: "Maintenance", state: "planned", description: "Συντήρηση. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      { key: "creative", label: "Creative Studio", state: "live", href: "/admin/creative", description: "Δημιουργία εικόνων + κειμένων με AI (πραγματικές ροές)." },
      { key: "campaigns", label: "Campaigns", state: "planned", description: "Καμπάνιες. " + PLANNED_EXAMPLE },
      { key: "media", label: "Media Library", state: "planned", description: "Βιβλιοθήκη μέσων. " + PLANNED_EXAMPLE },
      { key: "content-calendar", label: "Content Calendar", state: "planned", description: "Ημερολόγιο περιεχομένου. " + PLANNED_EXAMPLE },
      { key: "social-inbox", label: "Social Inbox", state: "planned", description: "Κοινωνικά μηνύματα & σχόλια. " + PLANNED_EXAMPLE },
      { key: "seo", label: "SEO", state: "planned", description: "SEO. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "comms",
    label: "Communications",
    items: [
      { key: "comms", label: "Communications", state: "live", tab: "comms", description: "Χρονολόγιο επικοινωνιών (email/κλήσεις/σημειώσεις)." },
      { key: "inbox", label: "Unified Inbox", state: "planned", description: "Ενοποιημένο inbox. " + PLANNED_EXAMPLE },
      { key: "whatsapp", label: "WhatsApp", state: "planned", description: "WhatsApp. " + PLANNED_EXAMPLE },
      { key: "viber", label: "Viber", state: "planned", description: "Viber. " + PLANNED_EXAMPLE },
      { key: "sms", label: "SMS", state: "planned", description: "SMS. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    items: [
      { key: "calendar", label: "Calendar & Tasks", state: "live", tab: "calendar", description: "Ημερολόγιο + εργασίες (tasks/reminders)." },
      { key: "documents", label: "Documents", state: "planned", description: "Έγγραφα. " + PLANNED_EXAMPLE },
      { key: "workflows", label: "Workflows", state: "planned", description: "Ροές εργασίας. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      { key: "invoices", label: "Invoices", state: "live", tab: "invoices", description: "Τιμολόγια με πραγματικά δεδομένα." },
      { key: "payments", label: "Payments", state: "planned", description: "Πληρωμές. " + PLANNED_EXAMPLE },
      { key: "commissions", label: "Commissions", state: "planned", description: "Προμήθειες. " + PLANNED_EXAMPLE },
      { key: "revenue", label: "Revenue", state: "planned", description: "Έσοδα. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "ai",
    label: "AI / JARVIS",
    items: [
      { key: "ai", label: "JARVIS", state: "live", tab: "ai", description: "Ο βοηθός AI με πραγματικές εντολές και εγκρίσεις." },
      { key: "agent-runs", label: "Agent Runs", state: "planned", description: "Εκτελέσεις agents. " + PLANNED_EXAMPLE },
      { key: "approvals", label: "Approvals", state: "planned", description: "Εγκρίσεις με βάση πολιτικών. " + PLANNED_EXAMPLE },
      { key: "knowledge", label: "Knowledge", state: "planned", description: "Γνωσιακή βάση. " + PLANNED_EXAMPLE },
      { key: "policies", label: "Policies", state: "planned", description: "Πολιτικές. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { key: "analytics", label: "Analytics", state: "live", tab: "analytics", description: "Αναλυτικά από πραγματικά δεδομένα." },
      { key: "kpis", label: "KPIs", state: "planned", description: "Στόχοι & KPI. " + PLANNED_EXAMPLE },
      { key: "forecasts", label: "Forecasts", state: "planned", description: "Προβλέψεις. " + PLANNED_EXAMPLE },
      { key: "customer-health", label: "Customer Health", state: "planned", description: "Υγεία πελατών. " + PLANNED_EXAMPLE },
      { key: "churn-risk", label: "Churn Risk", state: "planned", description: "Κίνδυνος απώλειας. " + PLANNED_EXAMPLE },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      { key: "notifications", label: "Notifications", state: "live", tab: "notifications", description: "Ειδοποιήσεις συστήματος." },
      { key: "social-accounts", label: "Social Accounts", state: "live", href: "/admin/social", description: "Συνδεδεμένοι λογαριασμοί social media." },
      { key: "settings", label: "Settings", state: "live", tab: "settings", description: "Ρυθμίσεις συστήματος." },
      { key: "users", label: "Users", state: "planned", description: "Χρήστες. " + PLANNED_EXAMPLE },
      { key: "integrations", label: "Integrations", state: "planned", description: "Ενσωματώσεις. " + PLANNED_EXAMPLE },
      { key: "audit-log", label: "Audit Log", state: "planned", description: "Ημερολόγιο ενεργειών. " + PLANNED_EXAMPLE },
      { key: "system-health", label: "System Health", state: "planned", description: "Υγεία συστήματος. " + PLANNED_EXAMPLE },
    ],
  },
];

// Columns in NAV_GROUPS are only serialized-friendly (key/label/href/tab);
// this lets the shell and CRM resolve a nav key back to its tab.
export const NAV_KEY_TO_TAB: Record<string, CrmTab> = {};
for (const g of NAV_GROUPS) for (const it of g.items) if (it.tab) NAV_KEY_TO_TAB[it.key] = it.tab;

export function liveTabs(): CrmTab[] {
  const out: CrmTab[] = [];
  for (const g of NAV_GROUPS) {
    for (const it of g.items) {
      if (it.state === "live" && it.tab) out.push(it.tab);
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