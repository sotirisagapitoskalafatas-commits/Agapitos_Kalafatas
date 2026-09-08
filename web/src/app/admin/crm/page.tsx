"use client";

import { useState, useEffect, useCallback, useRef } from "react";

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

interface Lead {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  property_type: string | null;
  region: string | null;
  service_category: string;
  comments: string | null;
  attached_files: { name: string; url: string; path: string }[];
  status: string;
  gdpr_consent: boolean;
  notes: string;
  // ── Energy "folder" fields (2026-09-07 migration) ──
  company?: string | null;
  address?: string | null;
  id_number?: string | null;      // Α.Τ.
  provider?: string | null;       // Πάροχος
  program?: string | null;        // Πρόγραμμα
  source?: string | null;         // Πηγή
  lead_type?: string | null;      // Τύπος
  partner?: string | null;        // Συνεργάτης
  partner_notes?: string | null;
  assigned_agent?: string | null; // Ανάθεση σε AI agent
  renewal_date?: string | null;   // Ημ. ανανέωσης
  supplies?: Supply[];
}

interface Supply {
  supply_number: string; // Αριθμός Παροχής ΔΕΔΔΗΕ
  type: string;          // Ρεύμα / Φυσικό Αέριο
  address: string;
  provider: string;
  notes: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  expected_close_date: string | null;
  notes: string;
  lead_id: string | null;
  leads?: { first_name: string; last_name: string; phone: string; email: string } | null;
  created_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  lead_id: string | null;
  deal_id: string | null;
  location: string;
  color: string;
  completed: boolean;
}

interface CommRecord {
  id: string;
  lead_id: string | null;
  deal_id: string | null;
  comm_type: string;
  direction: string;
  subject: string;
  body: string;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  leads?: { first_name: string; last_name: string } | null;
}

interface Invoice {
  id: string;
  lead_id: string | null;
  deal_id: string | null;
  invoice_number: string;
  type: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  items: { description: string; quantity: number; unit_price: number }[];
  notes: string;
  valid_until: string | null;
  created_at: string;
  leads?: { first_name: string; last_name: string } | null;
}

interface DashboardData {
  kpis: {
    totalLeads: number;
    newLeads: number;
    customers: number;
    conversionRate: string;
    pipelineValue: number;
    wonRevenue: number;
    pendingInvoices: number;
    paidInvoices: number;
    commsThisMonth: number;
    upcomingEvents: number;
  };
  serviceBreakdown: Record<string, number>;
  stageBreakdown: Record<string, number>;
  upcomingEvents: CalendarEvent[];
  recentActivity: { id: string; entity_type: string; action: string; details: any; created_at: string }[];
}

type Tab = "dashboard" | "leads" | "pipeline" | "calendar" | "comms" | "invoices" | "analytics" | "notifications" | "renewals" | "ai" | "settings" | "planned";

// ── Atlas IA navigation model ──
// Groups mirror the master architecture. Each item carries an honest module
// state so JARVIS and the owner are never tricked into thinking a module works
// when it does not. LIVE items route to real working surfaces; PLANNED items
// open an informative placeholder panel (no fake counts or dashboards).
type ModState = "live" | "beta" | "planned" | "disabled";
interface NavItem {
  key: string;
  label: string;
  state: ModState;
  tab?: Tab;               // in-page CRM tab
  href?: string;           // separate admin route
  description: string;     // shown on planned placeholder + hover
}
interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const PLANNED_EXAMPLE = "Not built yet — no fabricated data is displayed here.";

const NAV_GROUPS: NavGroup[] = [
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

const NAV_KEY_TO_TAB: Record<string, Tab> = {};
for (const g of NAV_GROUPS) for (const it of g.items) if (it.tab) NAV_KEY_TO_TAB[it.key] = it.tab;

function liveTabItems(): string[] {
  const out: string[] = [];
  for (const g of NAV_GROUPS) {
    for (const it of g.items) {
      if (it.state === "live" && it.tab) out.push(it.tab);
    }
  }
  return out;
}

interface StepCall {
  agent: string;
  input: string;
  result: string;
  durationMs: number;
}

interface AgentResult {
  finalAnswer: string;
  steps: StepCall[];
  provider: string;
  model: string;
  requestId: string;
}

interface Msg {
  role: "user" | "agent";
  content: string;
  result?: AgentResult;
  pending?: boolean;
  progress?: string;
  error?: boolean;
}

const STAGES = [
  { key: "lead", label: "Lead", color: "bg-slate-100 border-slate-300" },
  { key: "qualified", label: "Qualified", color: "bg-blue-50 border-blue-300" },
  { key: "proposal", label: "Proposal", color: "bg-yellow-50 border-yellow-300" },
  { key: "negotiation", label: "Negotiation", color: "bg-orange-50 border-orange-300" },
  { key: "closed_won", label: "Won", color: "bg-green-50 border-green-300" },
  { key: "closed_lost", label: "Lost", color: "bg-red-50 border-red-300" },
];

// ── Lead pipeline statuses (Greek labels + emoji + chip colors) ──
const LEAD_STATUSES = [
  { key: "new_lead",  label: "Νέα",            emoji: "🆕", color: "bg-blue-100 text-blue-700" },
  { key: "contacted", label: "Επικοινωνήθηκε", emoji: "📞", color: "bg-yellow-100 text-yellow-700" },
  { key: "qualified", label: "Qualified",      emoji: "✅", color: "bg-cyan-100 text-cyan-700" },
  { key: "customer",  label: "Μετατράπηκε",    emoji: "🎉", color: "bg-green-100 text-green-700" },
  { key: "lost",      label: "Χαμένα",         emoji: "❌", color: "bg-red-100 text-red-700" },
  { key: "archived",  label: "Διαγραμμένα",    emoji: "🗑️", color: "bg-slate-100 text-slate-500" },
];
const STATUS_META: Record<string, { label: string; emoji: string; color: string }> =
  Object.fromEntries(LEAD_STATUSES.map((s) => [s.key, s]));

// ── Dropdown option lists (Greek market) ──
const SERVICES = ["Ρεύμα", "Φυσικό Αέριο", "Φωτοβολταϊκά", "EV Charging", "Ενεργειακή Αποθήκευση", "Ασφάλεια Ζωής", "Ασφάλεια Υγείας", "Ασφάλεια Αυτοκινήτου", "Ασφάλεια Κατοικίας", "Web / Software"];
const PROVIDERS = ["ΔΕΗ", "Protergia", "ΗΡΩΝ", "Elpedison", "NRG", "Volton", "Ζενίθ", "Φυσικό Αέριο Ελλάδος", "Watt+Volt", "Elin", "Solar", "Άλλος"];
const PROGRAMS = ["Σταθερό", "Κυμαινόμενο", "Μπλε", "Πράσινο", "Οικιακό", "Επαγγελματικό", "Νυχτερινό", "Άλλο"];
const SOURCES = ["Ιστότοπος", "Facebook", "Instagram", "Google", "Σύσταση", "Τηλέφωνο", "Walk-in", "Συνεργάτης", "Άλλο"];
const LEAD_TYPES = ["Οικιακό", "Επαγγελματικό", "Βιομηχανικό"];
const AGENTS = ["Ενέργεια", "Ασφάλειες", "Web & Software"];
const SUPPLY_TYPES = ["Ρεύμα", "Φυσικό Αέριο"];

// ── Document slots (typed uploads stored at leadId/<key>/file) ──
const DOC_SLOTS: { key: string; label: string }[] = [
  { key: "taftotita",           label: "Ταυτότητα" },
  { key: "e9",                  label: "Ε9" },
  { key: "misthotirio",         label: "Μισθωτήριο" },
  { key: "symvolaio",           label: "Συμβόλαιο" },
  { key: "logariasmos_current", label: "Τρέχων Λογαριασμός" },
  { key: "logariasmos_prev",    label: "Προηγούμενος Λογαριασμός" },
];

const COMM_ICONS: Record<string, string> = {
  email: " ", phone: " ", sms: " ", whatsapp: " ", meeting: " ", note: " ",
};

export default function CRMDashboard() {
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const t = new URLSearchParams(window.location.search).get("tab");
      const live = liveTabItems();
      if (t && live.includes(t)) return t as Tab;
    }
    return "dashboard";
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [comms, setComms] = useState<CommRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showNewComm, setShowNewComm] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Atlas IA nav shell state ──
  const [plannedModule, setPlannedModule] = useState<{ label: string; description: string } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("atlas_nav_collapsed");
        return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      } catch { /* ignore */ }
    }
    return {};
  });
  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem("atlas_nav_collapsed", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  // ── Renewals (materialized tasks + upcoming + overdue) ──
  const [renewals, setRenewals] = useState<any[]>([]);
  const [renewalsOverdue, setRenewalsOverdue] = useState<any[]>([]);
  const [renewalsCounts, setRenewalsCounts] = useState<any>(null);
  const [renewalsRange, setRenewalsRange] = useState(90);
  const [renewalsFilter, setRenewalsFilter] = useState<"all" | "overdue">("all");
  const [renewalsBusy, setRenewalsBusy] = useState(false);
  const [renewalsError, setRenewalsError] = useState("");

  const fetchRenewals = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`/api/crm/renewals/upcoming?days=${renewalsRange}&overdue=1`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) { setRenewalsError(data.error || "Failed to load renewals"); return; }
      setRenewals(data.renewals ?? []);
      setRenewalsOverdue(data.overdue ?? []);
      setRenewalsCounts(data.counts ?? null);
      setRenewalsError("");
    } catch (e: any) {
      setRenewalsError(e?.message ?? "Failed to load renewals");
    }
  }, [renewalsRange]);

  const runRenewals = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    setRenewalsBusy(true);
    setRenewalsError("");
    try {
      const res = await fetch("/api/crm/renewals/run", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ windows: [90, 60, 30, 14, 7, 3, 1], actionWindows: [14, 7, 3, 1], email: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRenewalsError(data.error || "Run failed");
      } else {
        setRenewalsError(
          `Scan: +${data.scanned} · Materialized: +${data.materialized} · Owner emails: ${data.ownerEmailsSent}${data.ownerEmailSkipped?.length ? ` · Skipped: ${data.ownerEmailSkipped.join(", ")}` : ""}`
        );
        await fetchRenewals();
        fetchAll();
      }
    } catch (e: any) {
      setRenewalsError(e?.message ?? "Run failed");
    } finally {
      setRenewalsBusy(false);
    }
  };

  const toggleRenewalTask = async (taskId: string, completed: boolean) => {
    await fetch("/api/crm/events", {
      method: "PATCH",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id: taskId, completed: !completed }),
    });
    await fetchRenewals();
    fetchAll();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setAuthToken(data.token);
        setIsLoggedIn(true);
      } else {
        setLoginError(data.error || "Invalid credentials");
      }
    } catch {
      setLoginError("Unable to reach authentication service");
    }
  };

  const setAuthToken = (token: string) => {
    if (typeof window !== "undefined") localStorage.setItem("crm_token", token);
  };

  useEffect(() => {
    const token = typeof window !== "undefined" && localStorage.getItem("crm_token");
    if (token) {
      setAuthToken(token);
      setIsLoggedIn(true);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
    const authHeaders: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    const requests: Promise<{ status: number; body: any }>[] = [
      fetch("/api/crm/leads", { headers: authHeaders }).then(async r => ({ status: r.status, body: await r.json().catch(() => []) })),
      fetch("/api/crm/deals", { headers: authHeaders }).then(async r => ({ status: r.status, body: await r.json().catch(() => []) })),
      fetch("/api/crm/events", { headers: authHeaders }).then(async r => ({ status: r.status, body: await r.json().catch(() => []) })),
      fetch("/api/crm/communications", { headers: authHeaders }).then(async r => ({ status: r.status, body: await r.json().catch(() => []) })),
      fetch("/api/crm/invoices", { headers: authHeaders }).then(async r => ({ status: r.status, body: await r.json().catch(() => []) })),
      fetch("/api/crm/dashboard", { headers: authHeaders }).then(async r => ({ status: r.status, body: await r.json().catch(() => null) })),
      fetch("/api/crm/notifications", { headers: authHeaders }).then(async r => ({ status: r.status, body: await r.json().catch(() => []) })),
    ];

    const results = await Promise.all(requests);

    // If the stored token is rejected (401), it is stale/invalid — force a fresh login.
    if (results.some(r => r.status === 401)) {
      if (typeof window !== "undefined") localStorage.removeItem("crm_token");
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    const [leadsRes, dealsRes, eventsRes, commsRes, invRes, dashRes, notifRes] = results.map(r => r.body);

    if (!leadsRes.error && leadsRes.data) setLeads(leadsRes.data as Lead[]);
    else if (Array.isArray(leadsRes)) setLeads(leadsRes as Lead[]);
    if (dealsRes && !dealsRes.error) setDeals(dealsRes);
    if (eventsRes && !eventsRes.error) setEvents(eventsRes);
    if (commsRes && !commsRes.error) setComms(commsRes);
    if (invRes && !invRes.error) setInvoices(invRes);
    if (dashRes) setDashboard(dashRes);
    if (!notifRes.error && notifRes.data) setNotifications(notifRes.data);
    else if (Array.isArray(notifRes)) setNotifications(notifRes as any[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn) { fetchAll(); fetchRenewals(); }
  }, [isLoggedIn, fetchAll, fetchRenewals]);

  // Generalized field updater — PATCHes any subset of lead columns and updates
  // local state optimistically (no full refetch, so drawer inputs keep focus).
  const updateLeadFields = async (id: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    setSelectedLead((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
    await fetch("/api/crm/leads", {
      method: "PATCH",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id, ...patch }),
    });
  };

  const createLead = async (data: Partial<Lead>) => {
    const res = await fetch("/api/crm/leads", {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "create failed");
    }
    setShowNewLead(false);
    fetchAll();
  };

  const moveDeal = async (id: string, stage: string) => {
    await fetch("/api/crm/deals", {
      method: "PATCH",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id, stage }),
    });
    fetchAll();
  };

  const toggleEventComplete = async (id: string, completed: boolean) => {
    await fetch("/api/crm/events", {
      method: "PATCH",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id, completed: !completed }),
    });
    fetchAll();
  };

  const formatCurrency = (n: number) => `€${n.toLocaleString("el-GR", { minimumFractionDigits: 0 })}`;

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Atlas</h1>
            <p className="text-sm text-slate-500 mt-1">Agapitos Kalafatas</p>
          </div>
          <form onSubmit={handleLogin} className="crm-card-3d rounded-3xl p-8 space-y-4">
            {loginError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{loginError}</div>}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Username</label>
              <input type="text" required className="w-full p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-900" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Password</label>
              <input type="password" required className="w-full p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-900" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
            </div>
            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25">
              Login
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 flex">
      {/* Sidebar */}
      <aside className={`crm-glass-sidebar w-64 flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:sticky md:top-0`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Atlas</h1>
              <p className="text-[10px] text-blue-100/70">Agapitos Kalafatas</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_GROUPS.map((group) => {
            const collapsed = collapsedGroups[group.id] ?? false;
            return (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-300/70 hover:text-white transition-colors"
                >
                  <span>{group.label}</span>
                  <span className="text-[10px]">{collapsed ? "▸" : "▾"}</span>
                </button>
                {!collapsed && (
                  <div className="space-y-0.5 mt-0.5">
                    {group.items.map((item) => {
                      const isActive = item.tab === tab;
                      if (item.state === "planned") {
                        return (
                          <button
                            key={item.key}
                            title={item.description}
                            onClick={() => {
                              setPlannedModule({ label: item.label, description: item.description });
                              setTab("planned");
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              tab === "planned" && plannedModule?.label === item.label
                                ? "bg-white/15 text-white"
                                : "text-slate-300/60 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span className="text-xs text-slate-400">◌</span>
                            {item.label}
                            <span className="ml-auto text-[9px] uppercase tracking-wide bg-white/10 text-slate-300/60 rounded px-1.5 py-0.5">planned</span>
                          </button>
                        );
                      }
                      if (item.href) {
                        return (
                          <a
                            key={item.key}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all text-slate-200/80 hover:text-white hover:bg-white/10"
                          >
                            <span className="text-base">●</span>
                            {item.label}
                          </a>
                        );
                      }
                      return (
                        <button
                          key={item.key}
                          onClick={() => { setTab(item.tab as Tab); setSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                              : "text-slate-200/80 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <span className="text-base">●</span>
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => { setIsLoggedIn(false); localStorage.removeItem("crm_token"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-200/70 hover:text-red-300 hover:bg-white/10 transition-all"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 md:ml-64 ml-0 p-8 min-w-0">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/80">
          <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {sidebarOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-2 md:gap-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 capitalize">
              {tab === "planned" ? (plannedModule?.label ?? "Planned") : tab === "renewals" ? "Renewals" : tab}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {new Date().toLocaleDateString("el-GR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button onClick={() => { fetchAll(); fetchRenewals(); }} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors px-4 py-2 rounded-xl hover:bg-indigo-50">
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {tab === "dashboard" && <DashboardView data={dashboard} formatCurrency={formatCurrency} />}
            {tab === "leads" && <LeadsView leads={leads} onSelect={setSelectedLead} onNew={() => setShowNewLead(true)} updateFields={updateLeadFields} />}
            {tab === "pipeline" && <PipelineView deals={deals} onMove={moveDeal} onNewDeal={() => setShowNewDeal(true)} />}
            {tab === "calendar" && <CalendarView events={events} onToggle={toggleEventComplete} onNew={() => setShowNewEvent(true)} />}
            {tab === "comms" && <CommsView comms={comms} onNew={() => setShowNewComm(true)} />}
            {tab === "invoices" && <InvoicesView invoices={invoices} onNew={() => setShowNewInvoice(true)} />}
            {tab === "analytics" && <AnalyticsView dashboard={dashboard} leads={leads} deals={deals} invoices={invoices} formatCurrency={formatCurrency} />}
            {tab === "notifications" && <NotificationsView notifications={notifications} onRefresh={fetchAll} />}
            {tab === "renewals" && (
              <RenewalsView
                renewals={renewals}
                overdue={renewalsOverdue}
                counts={renewalsCounts}
                horizonDays={renewalsRange}
                range={renewalsRange}
                onRangeChange={setRenewalsRange}
                filter={renewalsFilter}
                onFilterChange={setRenewalsFilter}
                busy={renewalsBusy}
                error={renewalsError}
                onRun={runRenewals}
                onToggleTask={toggleRenewalTask}
                onOpenLead={(id) => {
                  const lead = leads.find((l) => l.id === id);
                  if (lead) setSelectedLead(lead);
                }}
              />
            )}
            {tab === "ai" && <AgentView />}
            {tab === "settings" && <SettingsView />}
            {tab === "planned" && <PlannedModuleView module={plannedModule} onBack={() => { setTab("dashboard"); setPlannedModule(null); }} />}
          </>
        )}
      </div>

      {/* Lead Folder Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onErased={(id) => {
            setSelectedLead(null);
            setLeads((prev) => prev.filter((l) => l.id !== id));
          }}
          updateFields={updateLeadFields}
          comms={comms}
          events={events}
        />
      )}

      {/* Modals */}
      {showNewLead && <NewLeadModal onClose={() => setShowNewLead(false)} onCreate={createLead} />}
      {showNewDeal && <NewDealModal leads={leads} onClose={() => setShowNewDeal(false)} onSaved={() => { setShowNewDeal(false); fetchAll(); }} />}
      {showNewEvent && <NewEventModal leads={leads} onClose={() => setShowNewEvent(false)} onSaved={() => { setShowNewEvent(false); fetchAll(); }} />}
      {showNewComm && <NewCommModal leads={leads} onClose={() => setShowNewComm(false)} onSaved={() => { setShowNewComm(false); fetchAll(); }} />}
      {showNewInvoice && <NewInvoiceModal leads={leads} onClose={() => setShowNewInvoice(false)} onSaved={() => { setShowNewInvoice(false); fetchAll(); }} />}
    </main>
  );
}

// ── Renewals ─────────────────────────────────────────────────────────────────
// Real data from /api/crm/renewals/upcoming (engine scans + materialized tasks)
// and /api/crm/renewals/run (manual scan/materialize/email orchestration).
type RenewalUIRow = {
  leadId: string;
  daysLeft?: number;
  daysOverdue?: number;
  renewalDate: string;
  name: string | null;
  email: string | null;
  service: string | null;
  reminderStatus: string;
  taskId: string | null;
  window: number | null;
};

const RENEWAL_WINDOW_LABELS: Record<number, string> = {
  1: "1η ημέρα",
  3: "3 ημέρες",
  7: "7 ημέρες",
  14: "14 ημέρες",
  30: "30 ημέρες",
  60: "60 ημέρες",
  90: "90 ημέρες",
};

function renewalStatusChip(status: string) {
  switch (status) {
    case "sent":
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Ειδοποίηση στάλθηκε</span>;
    case "materialized":
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Εργασία δημιουργήθηκε</span>;
    case "pending":
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">Σε αναμονή</span>;
    default:
      return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">Χωρίς υπενθύμιση</span>;
  }
}

function RenewalsView(props: {
  renewals: RenewalUIRow[];
  overdue: RenewalUIRow[];
  counts: { total: number; overdue: number; byWindow: Record<string, number> } | null;
  horizonDays: number;
  range: number;
  onRangeChange: (n: number) => void;
  filter: "all" | "overdue";
  onFilterChange: (f: "all" | "overdue") => void;
  busy: boolean;
  error: string;
  onRun: () => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onOpenLead: (leadId: string) => void;
}) {
  const { renewals, overdue, counts, range, horizonDays, onRangeChange, filter, onFilterChange, busy, error, onRun, onToggleTask, onOpenLead } = props;
  const eligible = countWindowEligible(renewals);

  const rows = filter === "overdue" ? overdue : renewals;
  const empty = rows.length === 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="crm-card-3d rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ανανεώσεις Συμβολαίων</h3>
            <p className="text-xs text-slate-500 mt-1">
              Σκανάρισμα {range} ημερών · {counts?.total ?? 0} ανανεώσεις · {counts?.overdue ?? 0} εκπρόθεσμες
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => onRangeChange(Number(e.target.value))}
              className="bg-white/80 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[30, 60, 90, 180, 365].map((d) => <option key={d} value={d}>{d} ημέρες</option>)}
            </select>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-white/80">
              {(["all", "overdue"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => onFilterChange(f)}
                  className={`px-3 py-2 text-xs font-semibold transition-colors ${filter === f ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {f === "all" ? "Όλες" : "Εκπρόθεσμες"}
                </button>
              ))}
            </div>
            <button
              onClick={onRun}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Εκτέλεση..." : "⚡ Σάρωση & Δημιουργία"}
            </button>
          </div>
        </div>

        {error && (
          <div className={`mt-4 p-3 rounded-xl text-sm ${error.startsWith("Scan:") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {error}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 7, 14, 30].map((w) => {
            const n = counts?.byWindow?.[String(w)] ?? 0;
            return (
              <div key={w} className="bg-slate-100/80 rounded-xl p-3">
                <div className="text-lg font-bold text-slate-900">{n}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Έως {w} ημέρες</div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          Αυτόματη καθημερινή εκτέλεση · pg_cron <code className="text-slate-500">renewal-daily-atlas</code> · καθημερινά 08:00 · Δημιουργεί εργασία ημερολογίου + ειδοποίηση ανά εκπρόθεσμη/επερχόμενη ανανέωση.
        </p>
      </div>

      {/* Rows */}
      <div className="crm-card-3d rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200/60">
          <h3 className="text-sm font-bold text-slate-900">
            {filter === "overdue" ? "Εκπρόθεσμες Ανανεώσεις" : `Επερχόμενες Ανανεώσεις (${horizonDays} ημ.)`}
          </h3>
          <span className="text-xs text-slate-500">{rows.length} slots</span>
        </div>

        {empty ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-slate-500 text-sm">{filter === "overdue" ? "Δεν υπάρχουν εκπρόθεσμες ανανεώσεις" : "Καμία ανανέωση σε αυτό το διάστημα"}</p>
            <p className="text-slate-600 text-xs mt-1">Το σύστημα θα σας ειδοποιήσει όταν πλησιάσουν</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200/60">
              {rows.map((r) => (
                  <div key={r.leadId} className="p-4 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => r.taskId && onToggleTask(r.taskId, false)}
                        disabled={!r.taskId}
                        title={r.taskId ? "Ολοκληρωμένη εργασία" : "Δεν έχει δημιουργηθεί εργασία"}
                        className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 transition-colors ${
                          r.taskId ? "border-indigo-400 hover:bg-indigo-100" : "border-slate-200 cursor-default"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => onOpenLead(r.leadId)} className="text-sm font-semibold text-slate-900 hover:text-indigo-600 hover:underline">
                            {r.name ?? "Χωρίς όνομα"}
                          </button>
                          {renewalStatusChip(r.reminderStatus)}
                          {r.service && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{r.service}</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {r.daysOverdue !== undefined
                            ? `${r.daysOverdue} μέρες εκπρόθεσμο`
                            : `Σε ${r.daysLeft} μέρες`}
                          {" · "}Ανανέωση: {new Date(r.renewalDate).toLocaleDateString("el-GR")}
                          {r.window && ` · Παράθυρο: ${RENEWAL_WINDOW_LABELS[r.window] ?? `${r.window} ημέρες`}`}
                        </p>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200/60 text-[11px] text-slate-500">
              {eligible} στηρίζονται σε εργασία εντός παραθύρου 7 ημερών · Οι εργασίες δημιουργούνται μία φορά ανά ανανέωση (idempotent).
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function countWindowEligible(rows: RenewalUIRow[]): number {
  let n = 0;
  for (const r of rows) {
    if (r.taskId && r.window != null && r.window <= 7) n++;
  }
  return n;
}

// ── Planned module placeholder ───────────────────────────────────────────────
// Honest module state: purpose + status only. No fabricated dashboards, counts
// or metrics — PLANNED modules are exactly that until they are actually built.
function PlannedModuleView({ module, onBack }: { module: { label: string; description: string } | null; onBack: () => void }) {
  if (!module) {
    return (
      <div className="crm-card-3d rounded-2xl p-12 text-center">
        <p className="text-slate-500 text-sm">Select a planned module from the sidebar.</p>
      </div>
    );
  }
  return (
    <div className="crm-card-3d rounded-2xl p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🗂</span>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{module.label}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold uppercase tracking-wide">Planned</span>
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{module.description}</p>
      <div className="mt-6 bg-slate-100/80 rounded-xl p-4 text-xs text-slate-500 space-y-2">
        <p>🛠 This module is on the Atlas build roadmap and has no fabricated data.</p>
        <p>👀 Nothing is shown here until it actually exists in the system.</p>
        <p>📦 Planned modules are scoped in the master architecture and built incrementally.</p>
      </div>
      <button
        onClick={onBack}
        className="mt-6 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md hover:shadow-lg transition"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}

/* ─── DASHBOARD VIEW ─── */
function DashboardView({ data, formatCurrency }: { data: DashboardData | null; formatCurrency: (n: number) => string }) {
  if (!data) return <div className="text-slate-500">No dashboard data available. Ensure the CRM tables exist in Supabase.</div>;
  const k = data.kpis;

  const cards = [
    { label: "Total Leads", value: k.totalLeads, icon: " ", color: "from-blue-500 to-cyan-500" },
    { label: "New Leads", value: k.newLeads, icon: " ", color: "from-indigo-500 to-purple-500" },
    { label: "Customers", value: k.customers, icon: "⭐", color: "from-green-500 to-emerald-500" },
    { label: "Conversion", value: `${k.conversionRate}%`, icon: " ", color: "from-amber-500 to-orange-500" },
    { label: "Pipeline Value", value: formatCurrency(k.pipelineValue), icon: " ", color: "from-violet-500 to-purple-500" },
    { label: "Won Revenue", value: formatCurrency(k.wonRevenue), icon: " ", color: "from-green-500 to-teal-500" },
    { label: "Pending Invoices", value: formatCurrency(k.pendingInvoices), icon: " ", color: "from-yellow-500 to-amber-500" },
    { label: "Paid Invoices", value: formatCurrency(k.paidInvoices), icon: "✅", color: "from-emerald-500 to-green-500" },
    { label: "Communications", value: k.commsThisMonth, icon: " ", color: "from-pink-500 to-rose-500" },
    { label: "Upcoming Events", value: k.upcomingEvents, icon: " ", color: "from-cyan-500 to-blue-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="crm-card-3d rounded-2xl p-5 hover:border-slate-200 transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-lg mb-3 shadow-lg`}>
              {c.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Breakdown */}
        <div className="crm-card-3d rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Leads by Service</h3>
          {Object.entries(data.serviceBreakdown).length === 0 ? (
            <p className="text-slate-600 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.serviceBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([service, count]) => {
                  const max = Math.max(...Object.values(data.serviceBreakdown));
                  const pct = (count / max) * 100;
                  return (
                    <div key={service}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{service}</span>
                        <span className="text-slate-500">{count}</span>
                      </div>
                      <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Pipeline Stages */}
        <div className="crm-card-3d rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Pipeline Stages</h3>
          {Object.entries(data.stageBreakdown).length === 0 ? (
            <p className="text-slate-600 text-sm">No deals yet</p>
          ) : (
            <div className="space-y-3">
              {STAGES.map((s) => {
                const count = data.stageBreakdown[s.key] || 0;
                const max = Math.max(...Object.values(data.stageBreakdown), 1);
                const pct = (count / max) * 100;
                return (
                  <div key={s.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{s.label}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${s.key === "closed_won" ? "bg-green-500" : s.key === "closed_lost" ? "bg-red-500" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="crm-card-3d rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Activity</h3>
        {data.recentActivity.length === 0 ? (
          <p className="text-slate-600 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {data.recentActivity.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-100/80 rounded-xl">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-xs">
                  {a.entity_type === "deal" ? " " : a.entity_type === "invoice" ? " " : " "}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">{a.action} {a.entity_type}</p>
                  <p className="text-[10px] text-slate-500">{new Date(a.created_at).toLocaleString("el-GR")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── LEADS VIEW (Διαχείριση Leads) ─── */
function LeadsView({ leads, onSelect, onNew, updateFields }: {
  leads: Lead[];
  onSelect: (l: Lead) => void;
  onNew: () => void;
  updateFields: (id: string, patch: Partial<Lead>) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const resetFilters = () => {
    setStatusFilter("all"); setSearch(""); setServiceFilter("all");
    setProviderFilter("all"); setSourceFilter("all"); setDateFrom(""); setDateTo("");
  };

  const filtered = leads.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (serviceFilter !== "all" && l.service_category !== serviceFilter) return false;
    if (providerFilter !== "all" && (l.provider || "") !== providerFilter) return false;
    if (sourceFilter !== "all" && (l.source || "") !== sourceFilter) return false;
    if (dateFrom && new Date(l.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(l.created_at) > new Date(dateTo + "T23:59:59")) return false;
    const q = search.toLowerCase().trim();
    if (q && !`${l.first_name} ${l.last_name} ${l.phone} ${l.email ?? ""} ${l.region ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const countFor = (key: string) => (key === "all" ? leads.length : leads.filter((l) => l.status === key).length);
  const selectCls = "text-xs px-3 py-2 rounded-xl bg-white/80 border border-slate-200 text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Διαχείριση Leads — αναζήτηση, φίλτρα, ανάθεση σε AI agents.</p>
        <div className="flex gap-2">
          <button onClick={resetFilters} className="text-xs px-4 py-2 rounded-xl font-medium bg-white/80 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-all">Επαναφορά Φίλτρων</button>
          <button onClick={onNew} className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25">+ Νέο Lead</button>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter("all")} className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${statusFilter === "all" ? "bg-indigo-500 text-white" : "bg-white/80 text-slate-500 hover:bg-slate-200"}`}>📁 Όλα {countFor("all")}</button>
        {LEAD_STATUSES.map((s) => (
          <button key={s.key} onClick={() => setStatusFilter(s.key)} className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${statusFilter === s.key ? "bg-indigo-500 text-white" : "bg-white/80 text-slate-500 hover:bg-slate-200"}`}>
            {s.emoji} {s.label} {countFor(s.key)}
          </button>
        ))}
      </div>

      {/* Search + date range */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Αναζήτηση με όνομα, email, τηλέφωνο ή περιοχή..."
          className="flex-1 min-w-[220px] p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <input type="date" className={selectCls} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span>—</span>
          <input type="date" className={selectCls} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {/* Dropdown filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select className={selectCls} value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
          <option value="all">Υπηρεσία: Όλες</option>
          {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={selectCls} value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
          <option value="all">Πάροχος: Όλοι</option>
          {PROVIDERS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={selectCls} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="all">Πηγή: Όλες</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={selectCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Κατάσταση: Όλες</option>
          {LEAD_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="crm-card-3d rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Δεν βρέθηκαν leads.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-4">Ημ/νία</th>
                  <th className="p-4">Όνομα</th>
                  <th className="p-4">Τηλέφωνο</th>
                  <th className="p-4">Περιοχή</th>
                  <th className="p-4">Υπηρεσία</th>
                  <th className="p-4">Πάροχος</th>
                  <th className="p-4">Κατάσταση</th>
                  <th className="p-4">AI Agent</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {filtered.map((lead) => {
                  const meta = STATUS_META[lead.status];
                  return (
                    <tr key={lead.id} className="hover:bg-slate-100/50 transition-all">
                      <td className="p-4 text-slate-500 text-xs">{new Date(lead.created_at).toLocaleDateString("el-GR")}</td>
                      <td className="p-4 font-semibold text-slate-900 cursor-pointer" onClick={() => onSelect(lead)}>{lead.first_name} {lead.last_name}</td>
                      <td className="p-4 font-mono text-indigo-600 text-xs">{lead.phone}</td>
                      <td className="p-4 text-slate-500 text-xs">{lead.region || "—"}</td>
                      <td className="p-4"><span className="text-xs px-2.5 py-1 rounded-lg bg-white/80 text-slate-600">{lead.service_category}</span></td>
                      <td className="p-4 text-slate-500 text-xs">{lead.provider || "—"}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${meta?.color || ""}`}>{meta ? `${meta.emoji} ${meta.label}` : lead.status}</span>
                      </td>
                      <td className="p-4">
                        <select
                          className="text-[11px] bg-white/80 text-slate-600 rounded-lg px-2 py-1.5 border border-slate-200 outline-none cursor-pointer"
                          value={lead.assigned_agent || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateFields(lead.id, { assigned_agent: e.target.value })}
                        >
                          <option value="">— Ανάθεση —</option>
                          {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </td>
                      <td className="p-4">
                        <button onClick={() => onSelect(lead)} className="text-xs bg-indigo-500/10 text-indigo-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors">📁 Άνοιγμα</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
/* ─── PIPELINE VIEW ─── */
function PipelineView({ deals, onMove, onNewDeal }: { deals: Deal[]; onMove: (id: string, stage: string) => void; onNewDeal: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onNewDeal} className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25">
          + New Deal
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage.key);
          const total = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
          return (
            <div key={stage.key} className={`min-w-[280px] flex-1 border rounded-2xl p-4 ${stage.color}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-700">{stage.label}</h3>
                <span className="text-xs bg-white/60 px-2 py-1 rounded-lg font-bold text-slate-600">{stageDeals.length} · €{total.toLocaleString()}</span>
              </div>
              <div className="space-y-3">
                {stageDeals.map(deal => (
                  <div key={deal.id} className="crm-card-3d rounded-xl p-4">
                    <p className="font-semibold text-sm text-slate-900">{deal.title}</p>
                    {deal.leads && <p className="text-xs text-slate-500 mt-1">{deal.leads.first_name} {deal.leads.last_name}</p>}
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm font-bold text-indigo-600">€{(deal.value || 0).toLocaleString()}</span>
                      <div className="flex gap-1">
                        {stage.key !== "closed_won" && stage.key !== "closed_lost" && (
                          <select
                            className="text-[10px] bg-slate-100 rounded-lg px-2 py-1 border-0 outline-none cursor-pointer"
                            value={deal.stage}
                            onChange={(e) => onMove(deal.id, e.target.value)}
                          >
                            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {stageDeals.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No deals</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── CALENDAR VIEW ─── */
function CalendarView({ events, onToggle, onNew }: { events: CalendarEvent[]; onToggle: (id: string, c: boolean) => void; onNew: () => void }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter(e => e.start_time.split("T")[0] === dateStr);
  };

  const typeColors: Record<string, string> = {
    meeting: "bg-indigo-500", call: "bg-green-500", task: "bg-amber-500", reminder: "bg-cyan-500", deadline: "bg-red-500",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(0)} className="text-xs bg-indigo-500/10 text-indigo-600 px-4 py-2 rounded-xl font-medium">Today</button>
          <button onClick={() => setWeekOffset(w => w - 1)} className="text-xs bg-white/80 text-slate-500 px-3 py-2 rounded-xl hover:bg-slate-200">←</button>
          <span className="text-sm font-bold text-slate-900">
            {days[0].toLocaleDateString("el-GR", { month: "short", day: "numeric" })} — {days[6].toLocaleDateString("el-GR", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="text-xs bg-white/80 text-slate-500 px-3 py-2 rounded-xl hover:bg-slate-200">→</button>
        </div>
        <button onClick={onNew} className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl">+ New Event</button>
      </div>

      <div className="crm-card-3d rounded-2xl overflow-hidden">
        <div className="grid grid-cols-8 border-b border-slate-200/60">
          <div className="p-3 text-[10px] text-slate-600 uppercase font-bold">Time</div>
          {days.map((d, i) => (
            <div key={i} className={`p-3 text-center border-l border-slate-200/60 ${d.toDateString() === today.toDateString() ? "bg-indigo-500/10" : ""}`}>
              <p className="text-[10px] text-slate-500 uppercase font-bold">{d.toLocaleDateString("el-GR", { weekday: "short" })}</p>
              <p className={`text-lg font-bold ${d.toDateString() === today.toDateString() ? "text-indigo-600" : "text-slate-900"}`}>{d.getDate()}</p>
            </div>
          ))}
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {hours.map(h => (
            <div key={h} className="grid grid-cols-8 border-b border-slate-200/60">
              <div className="p-2 text-[10px] text-slate-600 font-mono">{`${String(h).padStart(2, "0")}:00`}</div>
              {days.map((d, di) => {
                const dayEvents = getEventsForDay(d).filter(e => {
                  const eH = new Date(e.start_time).getHours();
                  return eH === h;
                });
                return (
                  <div key={di} className="border-l border-slate-200/60 p-1 min-h-[40px]">
                    {dayEvents.map(e => (
                      <button
                        key={e.id}
                        onClick={() => onToggle(e.id, e.completed)}
                        className={`w-full text-left text-[10px] px-2 py-1 rounded-lg mb-1 text-white truncate ${typeColors[e.event_type] || "bg-slate-600"} ${e.completed ? "opacity-40 line-through" : ""}`}
                        title={e.title}
                      >
                        {e.title}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── COMMS VIEW ─── */
function CommsView({ comms, onNew }: { comms: CommRecord[]; onNew: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onNew} className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl">+ Log Communication</button>
      </div>
      <div className="crm-card-3d rounded-2xl overflow-hidden">
        {comms.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No communications logged yet.</div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {comms.map(c => (
              <div key={c.id} className="p-4 hover:bg-slate-100/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/80 rounded-xl flex items-center justify-center text-sm">{COMM_ICONS[c.comm_type] || " "}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{c.subject || c.comm_type}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.direction === "inbound" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {c.direction}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-500">{c.comm_type}</span>
                    </div>
                    {c.leads && <p className="text-xs text-slate-500 mt-1">{c.leads.first_name} {c.leads.last_name}</p>}
                    {c.body && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.body}</p>}
                  </div>
                  <span className="text-[10px] text-slate-600">{new Date(c.created_at).toLocaleString("el-GR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── INVOICES VIEW ─── */
function InvoicesView({ invoices, onNew }: { invoices: Invoice[]; onNew: () => void }) {
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = invoices.filter(i => typeFilter === "all" || i.type === typeFilter);

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600", sent: "bg-blue-100 text-blue-600", accepted: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600", paid: "bg-emerald-100 text-emerald-600", expired: "bg-slate-100 text-slate-500",
  };

  const updateInvoiceStatus = async (id: string, status: string) => {
    await fetch("/api/crm/invoices", {
      method: "PATCH",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id, status }),
    });
    onNew();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["all", "quote", "invoice", "proforma"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${typeFilter === t ? "bg-indigo-500 text-white" : "bg-white/80 text-slate-500 hover:bg-slate-200"}`}>
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)} ({t === "all" ? invoices.length : invoices.filter(i => i.type === t).length})
            </button>
          ))}
        </div>
        <button onClick={onNew} className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl">+ New Quote/Invoice</button>
      </div>

      <div className="crm-card-3d rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No invoices or quotes yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-4">Number</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-100/50">
                    <td className="p-4 font-mono text-indigo-600 text-xs font-bold">{inv.invoice_number}</td>
                    <td className="p-4"><span className="text-xs px-2.5 py-1 rounded-lg bg-white/80 text-slate-600 capitalize">{inv.type}</span></td>
                    <td className="p-4 text-slate-900 text-sm">{inv.leads ? `${inv.leads.first_name} ${inv.leads.last_name}` : "—"}</td>
                    <td className="p-4 text-slate-900 font-bold">€{(inv.total || 0).toLocaleString("el-GR")}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusColors[inv.status] || ""}`}>{inv.status}</span>
                    </td>
                    <td className="p-4">
                      <select
                        className="text-[10px] bg-white/80 text-slate-600 rounded-lg px-2 py-1.5 border-0 outline-none cursor-pointer"
                        value={inv.status}
                        onChange={(e) => updateInvoiceStatus(inv.id, e.target.value)}
                      >
                        {["draft", "sent", "accepted", "rejected", "paid", "expired"].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ANALYTICS VIEW ─── */
function AnalyticsView({ dashboard, leads, deals, invoices, formatCurrency }: { dashboard: DashboardData | null; leads: Lead[]; deals: Deal[]; invoices: Invoice[]; formatCurrency: (n: number) => string }) {
  if (!dashboard) return <div className="text-slate-500">No data available.</div>;

  const monthlyLeads: Record<string, number> = {};
  leads.forEach(l => {
    const month = new Date(l.created_at).toLocaleDateString("el-GR", { month: "short", year: "numeric" });
    monthlyLeads[month] = (monthlyLeads[month] || 0) + 1;
  });

  const maxMonthly = Math.max(...Object.values(monthlyLeads), 1);

  const wonDeals = deals.filter(d => d.stage === "closed_won");
  const lostDeals = deals.filter(d => d.stage === "closed_lost");
  const winRate = deals.length > 0 ? ((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100 || 0).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <a href="/admin/diagnostic" className="text-sm bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 font-semibold px-5 py-2.5 rounded-xl transition-all border border-violet-500/20">
           Sales Diagnostic →
        </a>
        <a href="/admin/analytics" className="text-sm bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 font-semibold px-5 py-2.5 rounded-xl transition-all border border-indigo-500/20">
           Full Analytics →
        </a>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="crm-card-3d rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Lead Sources by Service</h3>
          <div className="space-y-3">
            {Object.entries(dashboard.serviceBreakdown).map(([s, c]) => (
              <div key={s} className="flex justify-between items-center">
                <span className="text-xs text-slate-600">{s}</span>
                <span className="text-xs font-bold text-slate-900">{c}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="crm-card-3d rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Deal Win Rate</h3>
          <div className="text-center py-4">
            <p className="text-5xl font-bold text-indigo-600">{winRate}%</p>
            <p className="text-xs text-slate-500 mt-2">{wonDeals.length} won / {lostDeals.length} lost / {deals.length} total</p>
          </div>
        </div>

        <div className="crm-card-3d rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue Summary</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Pipeline</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(dashboard.kpis.pipelineValue)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Won</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(dashboard.kpis.wonRevenue)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Paid Invoices</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(dashboard.kpis.paidInvoices)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Pending</p>
              <p className="text-lg font-bold text-yellow-700">{formatCurrency(dashboard.kpis.pendingInvoices)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Leads Chart */}
      <div className="crm-card-3d rounded-2xl p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Monthly Leads</h3>
        <div className="flex items-end gap-3 h-48">
          {Object.entries(monthlyLeads).slice(-12).map(([month, count]) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500 font-bold">{count}</span>
              <div
                className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all min-h-[4px]"
                style={{ height: `${(count / maxMonthly) * 140}px` }}
              />
              <span className="text-[9px] text-slate-600">{month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── FOLDER HELPERS ─── */
function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase text-slate-500">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">{label}</label>
      {children}
    </div>
  );
}

function FolderSelect({ value, opts, onChange, placeholder }: { value: string; opts: string[]; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <select
      className="w-full p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function DocSlot({ slot, docs, multiple, onUpload, onDelete }: {
  slot: { key: string; label: string };
  docs: { name: string; url: string; path: string; type: string }[];
  multiple?: boolean;
  onUpload: (f: File) => void;
  onDelete: (path: string) => void;
}) {
  const inputId = `doc-${slot.key}`;
  const has = docs.length > 0;
  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white/60">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-800">{slot.label}</span>
        {has && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✓ {docs.length}</span>}
      </div>

      {has && (
        <div className="space-y-1 mb-2">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200/60">
              <span className="text-xs text-slate-700 truncate font-medium">{d.name}</span>
              <div className="flex gap-1.5 shrink-0">
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-[11px] font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">Προβολή</a>
                <a href={d.url} download={d.name} className="px-2 py-1 text-[11px] font-semibold bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">⬇</a>
                <button onClick={() => onDelete(d.path)} className="px-2 py-1 text-[11px] font-semibold bg-red-100 text-red-600 rounded-lg hover:bg-red-200">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(!has || multiple) && (
        <div
          className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); Array.from(e.dataTransfer.files).forEach(onUpload); }}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <input
            type="file"
            id={inputId}
            multiple={multiple}
            className="hidden"
            onChange={(e) => { Array.from(e.target.files || []).forEach(onUpload); (e.target as HTMLInputElement).value = ""; }}
          />
          <p className="text-xs text-slate-500">Μεταφορά ή κλικ για μεταφόρτωση</p>
          <p className="text-[10px] text-slate-400">PDF, JPG, PNG, DOC έως 25MB</p>
        </div>
      )}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-white/70 border border-slate-200/60 rounded-xl p-3 text-center">
      <p className="text-xl font-bold text-slate-900">{n}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function Timeline({ lead, comms, events, docCount }: { lead: Lead; comms: CommRecord[]; events: CalendarEvent[]; docCount: number }) {
  type Item = { when: string; icon: string; title: string; sub?: string };
  const items: Item[] = [];
  items.push({ when: lead.created_at, icon: "🆕", title: "Δημιουργία lead", sub: lead.service_category });
  for (const c of comms) items.push({ when: c.created_at, icon: "✉️", title: `${c.comm_type} · ${c.direction}`, sub: c.subject || (c.body ? c.body.slice(0, 60) : "") });
  for (const e of events) items.push({ when: e.start_time, icon: "📅", title: e.title, sub: e.event_type });
  items.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat n={comms.length} label="Επικοινωνίες" />
        <Stat n={events.length} label="Ραντεβού" />
        <Stat n={docCount} label="Έγγραφα" />
      </div>
      <Section title="Χρονολόγιο">
        {items.length === 0 ? (
          <p className="text-xs text-slate-500">Καμία δραστηριότητα.</p>
        ) : (
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-100/70 rounded-xl">
                <span className="text-base">{it.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">{it.title}</p>
                  {it.sub && <p className="text-xs text-slate-500 truncate">{it.sub}</p>}
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">{new Date(it.when).toLocaleString("el-GR")}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ─── LEAD FOLDER (tabbed drawer) ─── */
type FolderTab = "genika" | "paroxes" | "synergates" | "eggrafa" | "prosfores" | "istoriko";

function LeadDrawer({ lead, onClose, onErased, updateFields, comms, events }: {
  lead: Lead;
  onClose: () => void;
  onErased: (id: string) => void;
  updateFields: (id: string, patch: Partial<Lead>) => void;
  comms: CommRecord[];
  events: CalendarEvent[];
}) {
  const [tab, setTab] = useState<FolderTab>("genika");
  const [groups, setGroups] = useState<Record<string, { name: string; url: string; path: string; type: string }[]>>({});
  const [supplies, setSupplies] = useState<Supply[]>(lead.supplies || []);
  const suppliesRef = useRef<Supply[]>(lead.supplies || []);
  // GDPR: export erases only on typed confirmation; export downloads a JSON bundle.
  const [gdprBusy, setGdprBusy] = useState("");
  const [gdprConfirm, setGdprConfirm] = useState("");

  useEffect(() => {
    setSupplies(lead.supplies || []);
    suppliesRef.current = lead.supplies || [];
    setTab("genika");
  }, [lead.id]);

  const loadDocs = useCallback(() => {
    fetch(`/api/documents?lead_id=${lead.id}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setGroups(data.groups || {}))
      .catch(() => {});
  }, [lead.id]);

  useEffect(() => { if (lead?.id) loadDocs(); }, [lead.id, loadDocs]);

  const save = (patch: Partial<Lead>) => updateFields(lead.id, patch);

  const commitSupplies = (next: Supply[]) => { suppliesRef.current = next; setSupplies(next); save({ supplies: next }); };
  const addSupply = () => commitSupplies([...suppliesRef.current, { supply_number: "", type: "Ρεύμα", address: "", provider: "", notes: "" }]);
  const removeSupply = (i: number) => commitSupplies(suppliesRef.current.filter((_, j) => j !== i));
  // Controlled edit: update local state on each keystroke (correct display after
  // a row is removed), persist to the DB only on blur / select change.
  const setSupplyLocal = (i: number, field: keyof Supply, val: string) => {
    const next = suppliesRef.current.map((s, j) => (j === i ? { ...s, [field]: val } : s));
    suppliesRef.current = next;
    setSupplies(next);
  };
  const persistSupplies = () => save({ supplies: suppliesRef.current });

  const uploadDoc = async (docType: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("lead_id", lead.id);
    fd.append("doc_type", docType);
    const res = await fetch("/api/documents", { method: "POST", headers: getAuthHeaders(), body: fd });
    if (res.ok) loadDocs();
  };
  const deleteDoc = async (path: string) => {
    await fetch("/api/documents", {
      method: "DELETE",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ path }),
    });
    loadDocs();
  };

  // GDPR: full export bundle → downloadable JSON. Signed doc URLs expire in 7 days.
  const exportData = async () => {
    setGdprBusy("export");
    try {
      const res = await fetch(`/api/gdpr?lead_id=${lead.id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Export failed");
      const bundle = await res.json();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lead-${lead.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGdprBusy("");
    }
  };

  // GDPR: erase the person's data (documents, communications, calendar events,
  // lead row). Requires typing ΔΙΑΓΡΑΦΗ to arm. Financial rows (deals, invoices)
  // keep their records — their lead_id is SET NULL in prod.
  const eraseData = async () => {
    if (gdprConfirm !== "ΔΙΑΓΡΑΦΗ") return;
    setGdprBusy("erase");
    try {
      const res = await fetch("/api/gdpr", {
        method: "DELETE",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ lead_id: lead.id, confirm: true }),
      });
      if (!res.ok) throw new Error("Erase failed");
      onErased(lead.id);
    } finally {
      setGdprBusy("");
    }
  };

  const TABS: { key: FolderTab; label: string; icon: string }[] = [
    { key: "genika",     label: "Γενικά",     icon: "🧾" },
    { key: "paroxes",    label: "Παροχές",    icon: "⚡" },
    { key: "synergates", label: "Συνεργάτες", icon: "🤝" },
    { key: "eggrafa",    label: "Έγγραφα",    icon: "📄" },
    { key: "prosfores",  label: "Προσφορές",  icon: "💶" },
    { key: "istoriko",   label: "Ιστορικό",   icon: "🕓" },
  ];

  const inputCls = "w-full p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50" onClick={onClose}>
      <div className="bg-white/70 backdrop-blur-xl w-full max-w-2xl h-full shadow-2xl overflow-y-auto border-l border-slate-200/60" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-200/60 sticky top-0 bg-white/80 backdrop-blur-xl z-10">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-semibold uppercase text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-lg">📁 Φάκελος #{lead.id.substring(0, 8)}</span>
              <h2 className="text-2xl font-bold mt-2 text-slate-900">{lead.first_name} {lead.last_name}</h2>
              <p className="text-xs text-slate-500 mt-1">Δημιουργήθηκε {new Date(lead.created_at).toLocaleString("el-GR")}</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-900 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors">✕</button>
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-4">
            <span className="text-[10px] font-bold text-slate-500 mr-1">Κατάσταση:</span>
            {LEAD_STATUSES.map((s) => (
              <button
                key={s.key}
                onClick={() => save({ status: s.key })}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${lead.status === s.key ? "bg-indigo-500 text-white" : "bg-white/70 text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mt-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${tab === t.key ? "bg-indigo-600 text-white shadow" : "bg-white/70 text-slate-600 border border-slate-200 hover:bg-slate-100"}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ── ΓΕΝΙΚΑ ── */}
          {tab === "genika" && (
            <div className="space-y-5">
              <Section title="Στοιχεία Πελάτη">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Όνομα"><input className={inputCls} defaultValue={lead.first_name} onBlur={(e) => save({ first_name: e.target.value })} /></Field>
                  <Field label="Επώνυμο"><input className={inputCls} defaultValue={lead.last_name} onBlur={(e) => save({ last_name: e.target.value })} /></Field>
                  <Field label="Τηλέφωνο"><input className={inputCls} defaultValue={lead.phone} onBlur={(e) => save({ phone: e.target.value })} /></Field>
                  <Field label="Email"><input className={inputCls} defaultValue={lead.email || ""} onBlur={(e) => save({ email: e.target.value })} /></Field>
                  <Field label="Περιοχή"><input className={inputCls} defaultValue={lead.region || ""} onBlur={(e) => save({ region: e.target.value })} /></Field>
                  <Field label="Εταιρεία"><input className={inputCls} defaultValue={lead.company || ""} onBlur={(e) => save({ company: e.target.value })} /></Field>
                  <Field label="Διεύθυνση"><input className={inputCls} defaultValue={lead.address || ""} onBlur={(e) => save({ address: e.target.value })} /></Field>
                  <Field label="Α.Τ. (Ταυτότητα)"><input className={inputCls} defaultValue={lead.id_number || ""} onBlur={(e) => save({ id_number: e.target.value })} /></Field>
                </div>
              </Section>

              <Section title="Κατηγοριοποίηση">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Υπηρεσία"><FolderSelect value={lead.service_category} opts={SERVICES} onChange={(v) => save({ service_category: v })} /></Field>
                  <Field label="Πάροχος"><FolderSelect value={lead.provider || ""} opts={PROVIDERS} placeholder="—" onChange={(v) => save({ provider: v })} /></Field>
                  <Field label="Πρόγραμμα"><FolderSelect value={lead.program || ""} opts={PROGRAMS} placeholder="—" onChange={(v) => save({ program: v })} /></Field>
                  <Field label="Πηγή"><FolderSelect value={lead.source || ""} opts={SOURCES} placeholder="—" onChange={(v) => save({ source: v })} /></Field>
                  <Field label="Τύπος"><FolderSelect value={lead.lead_type || ""} opts={LEAD_TYPES} placeholder="—" onChange={(v) => save({ lead_type: v })} /></Field>
                  <Field label="Ανάθεση σε AI Agent"><FolderSelect value={lead.assigned_agent || ""} opts={AGENTS} placeholder="—" onChange={(v) => save({ assigned_agent: v })} /></Field>
                  <Field label="Ημ. Ανανέωσης Συμβολαίου"><input type="date" className={inputCls} defaultValue={lead.renewal_date || ""} onBlur={(e) => save({ renewal_date: e.target.value || null })} /></Field>
                  <Field label="GDPR">
                    <span className={`inline-block text-xs px-2.5 py-2 rounded-lg font-medium ${lead.gdpr_consent ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{lead.gdpr_consent ? "✓ Συναίνεση" : "Χωρίς συναίνεση"}</span>
                  </Field>
                </div>
              </Section>

              <Section title="Σημειώσεις">
                <textarea rows={4} className={inputCls + " resize-none"} placeholder="Σημειώσεις για το lead..." defaultValue={lead.notes || ""} onBlur={(e) => save({ notes: e.target.value })} />
              </Section>

              <Section title="Ζώνη Δεδομένων (GDPR)">
                <div className="space-y-3">
                  <div>
                    <button
                      onClick={exportData}
                      disabled={gdprBusy === "erase"}
                      className="w-full p-2.5 rounded-xl text-sm font-semibold bg-white/70 border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                    >
                      {gdprBusy === "export" ? "Δημιουργία export…" : "⬇ Εξαγωγή δεδομένων (JSON)"}
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1">Πλήρες αντίγραφο του φακέλου (στοιχεία, επικοινωνίες, ραντεβού, τιμολόγια, αρχεία με συνδέσμους 7 ημερών).</p>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <label className="text-xs font-semibold text-red-600">Διαγραφή δεδομένων</label>
                    <input
                      className={inputCls + " mt-1"}
                      placeholder='Πληκτρολογήστε "ΔΙΑΓΡΑΦΗ" για να ενεργοποιηθεί'
                      value={gdprConfirm}
                      onChange={(e) => setGdprConfirm(e.target.value)}
                    />
                    <button
                      onClick={eraseData}
                      disabled={gdprConfirm !== "ΔΙΑΓΡΑΦΗ" || gdprBusy === "export"}
                      className={`w-full p-2.5 rounded-xl text-sm font-semibold mt-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${gdprConfirm === "ΔΙΑΓΡΑΦΗ" && gdprBusy !== "export" ? "bg-red-600 text-white hover:bg-red-700" : "bg-slate-100 text-slate-400"}`}
                    >
                      {gdprBusy === "erase" ? "Διαγραφή…" : "🗑 Μόνιμη διαγραφή (GDPR)"}
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1">Διαγράφει οριστικά το φάκελο, τα αρχεία, τις επικοινωνίες και τα ραντεβού. Οι προσφορές/τιμολόγια παραμένουν (νομική υποχρέωση), μόνο η σύνδεση με το φάκελο αφαιρείται.</p>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ── ΠΑΡΟΧΕΣ ── */}
          {tab === "paroxes" && (
            <Section
              title="Αριθμοί Παροχής ΔΕΔΔΗΕ"
              action={<button onClick={addSupply} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">+ Προσθήκη Παροχής</button>}
            >
              {supplies.length === 0 ? (
                <p className="text-xs text-slate-500">Καμία παροχή. Πατήστε «+ Προσθήκη Παροχής».</p>
              ) : (
                <div className="space-y-3">
                  {supplies.map((s, i) => (
                    <div key={i} className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Παροχή #{i + 1}</span>
                        <button onClick={() => removeSupply(i)} className="text-red-500 hover:text-red-700 text-xs">Διαγραφή ✕</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input className={inputCls} placeholder="Αριθμός Παροχής" value={s.supply_number} onChange={(e) => setSupplyLocal(i, "supply_number", e.target.value)} onBlur={persistSupplies} />
                        <select className={inputCls} value={s.type} onChange={(e) => { setSupplyLocal(i, "type", e.target.value); persistSupplies(); }}>
                          {SUPPLY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input className={inputCls} placeholder="Διεύθυνση παροχής" value={s.address} onChange={(e) => setSupplyLocal(i, "address", e.target.value)} onBlur={persistSupplies} />
                        <input className={inputCls} placeholder="Πάροχος" value={s.provider} onChange={(e) => setSupplyLocal(i, "provider", e.target.value)} onBlur={persistSupplies} />
                      </div>
                      <input className={inputCls} placeholder="Σημειώσεις" value={s.notes} onChange={(e) => setSupplyLocal(i, "notes", e.target.value)} onBlur={persistSupplies} />
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* ── ΣΥΝΕΡΓΑΤΕΣ ── */}
          {tab === "synergates" && (
            <Section title="Συνεργάτης / Σύσταση">
              <div className="space-y-3">
                <Field label="Συνεργάτης"><input className={inputCls} defaultValue={lead.partner || ""} onBlur={(e) => save({ partner: e.target.value })} /></Field>
                <Field label="Σημειώσεις συνεργάτη"><textarea rows={4} className={inputCls + " resize-none"} defaultValue={lead.partner_notes || ""} onBlur={(e) => save({ partner_notes: e.target.value })} /></Field>
              </div>
            </Section>
          )}

          {/* ── ΕΓΓΡΑΦΑ ── */}
          {tab === "eggrafa" && (
            <div className="space-y-3">
              {DOC_SLOTS.map((slot) => (
                <DocSlot key={slot.key} slot={slot} docs={groups[slot.key] || []} onUpload={(f) => uploadDoc(slot.key, f)} onDelete={deleteDoc} />
              ))}
              <DocSlot slot={{ key: "other", label: "Άλλα Έγγραφα" }} docs={groups["other"] || []} multiple onUpload={(f) => uploadDoc("other", f)} onDelete={deleteDoc} />

              {lead.attached_files?.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3 bg-white/60">
                  <span className="text-sm font-semibold text-slate-800">Συνημμένα από φόρμα</span>
                  <div className="space-y-1 mt-2">
                    {lead.attached_files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                        <span className="text-xs text-slate-700 truncate font-medium">{f.name}</span>
                        <a href={f.url} target="_blank" rel="noreferrer" className="px-2 py-1 text-[11px] font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">Προβολή</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ΠΡΟΣΦΟΡΕΣ ── */}
          {tab === "prosfores" && (
            <DocSlot slot={{ key: "prosfores", label: "Προσφορές" }} docs={groups["prosfores"] || []} multiple onUpload={(f) => uploadDoc("prosfores", f)} onDelete={deleteDoc} />
          )}

          {/* ── ΙΣΤΟΡΙΚΟ ── */}
          {tab === "istoriko" && (
            <Timeline
              lead={lead}
              comms={comms.filter((c) => c.lead_id === lead.id)}
              events={events.filter((e) => e.lead_id === lead.id)}
              docCount={Object.values(groups).reduce((n, arr) => n + arr.length, 0)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── NEW LEAD MODAL ─── */
function NewLeadModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: Partial<Lead>) => Promise<void> }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "", region: "", service_category: "Ρεύμα", provider: "", source: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.phone.trim()) { setError("Όνομα και τηλέφωνο είναι υποχρεωτικά."); return; }
    setSaving(true); setError("");
    try {
      await onCreate(form);
    } catch {
      setError("Σφάλμα δημιουργίας. Δοκιμάστε ξανά.");
      setSaving(false);
    }
  };

  const inputCls = "w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-2xl p-8 w-full max-w-[min(95vw,36rem)] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900 mb-6">Νέο Lead</h2>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Όνομα *</label><input className={inputCls} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><label className={labelCls}>Επώνυμο</label><input className={inputCls} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            <div><label className={labelCls}>Τηλέφωνο *</label><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className={labelCls}>Email</label><input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className={labelCls}>Περιοχή</label><input className={inputCls} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
            <div>
              <label className={labelCls}>Υπηρεσία</label>
              <select className={inputCls} value={form.service_category} onChange={(e) => setForm({ ...form, service_category: e.target.value })}>
                {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Πάροχος</label>
              <select className={inputCls} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
                <option value="">—</option>
                {PROVIDERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Πηγή</label>
              <select className={inputCls} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="">—</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className={labelCls}>Σημειώσεις</label><textarea rows={3} className={inputCls + " resize-none"} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/80 text-slate-500 rounded-xl font-medium hover:bg-slate-200">Άκυρο</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all disabled:opacity-50">{saving ? "Αποθήκευση..." : "Δημιουργία"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
/* ─── AI AGENT VIEW (embedded) ─── */
function AgentView() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const COMMANDS: Array<{ slug: string; name: string; category: string }> = [
    { slug: "/monday-brief", name: "Monday Brief", category: "Week" },
    { slug: "/friday-brief", name: "Friday Brief", category: "Week" },
    { slug: "/invoice-chase", name: "Invoice Chase", category: "Money" },
    { slug: "/cash-flow-snapshot", name: "Cash Flow Snapshot", category: "Money" },
    { slug: "/lead-triage", name: "Lead Triage", category: "Sales" },
    { slug: "/call-list", name: "Call List", category: "Sales" },
    { slug: "/customer-pulse", name: "Customer Pulse", category: "Customers" },
    { slug: "/handle-complaint", name: "Handle Complaint", category: "Customers" },
    { slug: "/sales-brief", name: "Sales Brief", category: "Sales" },
    { slug: "/content-strategy", name: "Content Strategy", category: "Marketing" },
    { slug: "/review-contract", name: "Review Contract", category: "Paperwork" },
    { slug: "/business-pulse", name: "Business Pulse", category: "Week" },
  ];

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/approvals", { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.approvals) setApprovals(data.approvals);
    } catch {}
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const decide = async (approvalId: string, decision: "approved" | "rejected") => {
    try {
      await fetch("/api/agent/approvals", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ approvalId, decision, decidedBy: "admin" }),
      });
      fetchApprovals();
    } catch {}
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "agent", content: "", pending: true }]);

    try {
      const isCommand = text.startsWith("/");
      if (isCommand) {
        const res = await fetch("/api/agent/command", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ command: text }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setMessages((m) => {
            const next = [...m];
            next[next.length - 1] = { role: "agent", content: data.error || "Something went wrong. Please try again.", error: true };
            return next;
          });
        } else {
          const cmdResult = data as any;
          const stagedNote =
            cmdResult.staged?.count > 0
              ? `\n\n✍️ ${cmdResult.staged.count} action(s) staged as ${cmdResult.staged.actionType} — pending your approval in the panel. Nothing was sent yet.`
              : "";
          const missingNote =
            cmdResult.connectorsMissing?.length
              ? `\n\n_Note: connectors not yet connected — ${cmdResult.connectorsMissing.join(", ")} (stub data shown)._`
              : "";
          setMessages((m) => {
            const next = [...m];
            next[next.length - 1] = {
              role: "agent",
              content: cmdResult.response + stagedNote + missingNote,
              result: {
                finalAnswer: cmdResult.response,
                steps: [{ agent: `command:${cmdResult.command}`, input: text, result: cmdResult.response, durationMs: 0 }],
                provider: "plugin",
                model: "stub",
                requestId: cmdResult.requestId || "local",
              },
            };
            return next;
          });
          fetchApprovals();
        }
      } else {
        // Streaming branch: consume NDJSON from /api/agent/stream and update progress live.
        const res = await fetch("/api/agent/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ message: text }),
        });
        if (!res.ok || !res.body) {
          let msg = "Something went wrong. Please try again.";
          try {
            const err = await res.json();
            if (err.error) msg = err.error;
          } catch {}
          setMessages((m) => {
            const next = [...m];
            next[next.length - 1] = { role: "agent", content: msg, error: true };
            return next;
          });
        } else {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let finalResult: (AgentResult & { requestId: string }) | null = null;
          let streamError = "";

          const updateLast = (patch: Partial<Msg>) =>
            setMessages((m) => {
              const next = [...m];
              next[next.length - 1] = { ...next[next.length - 1], ...patch };
              return next;
            });

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.trim()) continue;
              let evt: any;
              try {
                evt = JSON.parse(line);
              } catch {
                continue;
              }
              if (evt.type === "progress") {
                updateLast({ progress: evt.message });
              } else if (evt.type === "result") {
                finalResult = evt;
              } else if (evt.type === "error") {
                streamError = evt.error || "Agent error";
              }
            }
          }

          if (finalResult) {
            updateLast({
              pending: false,
              progress: undefined,
              content: finalResult.finalAnswer,
              result: finalResult as AgentResult,
            });
          } else {
            updateLast({
              pending: false,
              progress: undefined,
              content: streamError || "The agent did not return a response. Please try again.",
              error: true,
            });
          }
        }
      }
    } catch {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "agent", content: "Network error. Could not reach the agent service.", error: true };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat panel */}
      <div className="lg:col-span-2 crm-card-3d rounded-2xl overflow-hidden flex flex-col" style={{ height: "calc(100vh - 9rem)" }}>
        {/* Suggestions */}
        <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-1 border-b border-slate-200/60 bg-white/40">
          {["How many leads are in the CRM?", "What's my sales pipeline value?", "Tell me about e-shop pricing", "What is the win rate?"].map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="whitespace-nowrap px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-full text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 mt-16">
              <div className="text-5xl mb-3">🤖</div>
              <p className="font-medium text-slate-500">Atlas Master is ready</p>
              <p className="text-sm">Ask me anything about your business, services, or CRM data.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-md"
                  : m.pending
                  ? "bg-white/80 border border-slate-200 text-slate-500 rounded-bl-md"
                  : m.error
                  ? "bg-red-50 border border-red-200 text-red-700 rounded-bl-md"
                  : "bg-white/80 border border-slate-200 text-slate-800 rounded-bl-md"
              }`}>
                {m.pending ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    {m.progress || "Master is dispatching sub-agents…"}
                  </span>
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}

                {m.result && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
                    {m.result.steps.map((s, j) => (
                      <div key={j} className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5">
                        <span className="font-medium text-indigo-600">→ {s.agent}</span>
                        <span>{s.durationMs}ms</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{m.result.provider} · {m.result.model}</span>
                      <span className="font-mono text-[10px]">{m.result.requestId.slice(0, 8)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200/70 bg-white/50 p-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask Atlas Master… (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="flex-1 resize-none p-3 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-900"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
            >
              {loading ? "…" : "Send"}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 text-center">
            The LLM proposes; Postgres &amp; tenant-scoped RPCs authorize. Requests are audited.
          </p>
        </div>
      </div>

      {/* Activity / Registry panel */}
      <div className="crm-card-3d rounded-2xl overflow-y-auto p-5" style={{ height: "calc(100vh - 9rem)" }}>
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
          Pending Approvals{" "}
          {approvals.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
              {approvals.length}
            </span>
          )}
        </h2>

        {approvals.length === 0 ? (
          <p className="text-xs text-slate-500 mb-4">No actions awaiting approval.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {approvals.map((a) => (
              <li key={a.id} className="bg-white/80 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">{a.action_type}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{(a.idempotency_key || a.id).slice(0, 8)}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 mt-1">{a.summary}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => decide(a.id, "approved")} className="flex-1 px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Approve</button>
                  <button onClick={() => decide(a.id, "rejected")} className="flex-1 px-2 py-1 text-[11px] font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600">Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
          Small Business Commands{" "}
          <span className="text-[10px] font-normal text-slate-500 normal-case">(tap to run)</span>
        </h2>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {COMMANDS.map((c) => (
            <button
              key={c.slug}
              onClick={() => setInput(c.slug)}
              className="px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50/60 text-indigo-700 text-[11px] font-semibold hover:bg-indigo-100 transition"
              title={c.name}
            >
              {c.slug}
            </button>
          ))}
        </div>

        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Agent Registry</h2>
        <ul className="space-y-2">
          {[
            ["webdev", "Web & Software", "E-shops, SaaS, AI agents"],
            ["energy", "Energy Services", "Electricity, gas, PV, EV"],
            ["insurance", "Insurance", "Life, health, car, property"],
            ["leadcrm", "Lead & CRM", "Leads, deals, pipeline, invoices"],
            ["analytics", "Business Intel", "Pipeline metrics, forecasts"],
            ["comms", "Communications", "Email & comm log"],
            ["tasks", "Tasks", "To-dos & reminders"],
            ["documents", "Documents", "Client document vault"],
            ["operations", "Operations", "Adds leads/deals/events"],
            ["general", "General Knowledge", "Company knowledge base"],
          ].map(([id, name, desc]) => (
            <li key={id} className="bg-white/80 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-sm text-slate-800">{name}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </li>
          ))}
        </ul>

        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-6 mb-2">Model Cascade</h2>
        <div className="text-xs text-slate-500 space-y-1">
          <p>1. <b>Router</b> — routes to agent (small)</p>
          <p>2. <b>Specialist</b> — agent runs tools</p>
          <p>3. <b>Tier</b> — complexity &amp; risk gating</p>
          <p className="text-amber-600"><b>Writes</b> — proposed → approved → executed</p>
        </div>
      </div>
    </div>
  );
}

/* ─── MODALS ─── */
function NewDealModal({ leads, onClose, onSaved }: { leads: Lead[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: "", value: "", lead_id: "", expected_close_date: "", notes: "" });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/crm/deals", {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ...form, value: parseFloat(form.value) || 0 }),
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="crm-card-3d rounded-2xl p-8 w-full max-w-[min(95vw,32rem)] shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900 mb-6">New Deal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Deal Title *</label>
            <input required className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Value (€)</label>
              <input type="number" className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Expected Close</label>
              <input type="date" className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={form.expected_close_date} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Linked Lead</label>
            <select className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>
              <option value="">None</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/80 text-slate-500 rounded-xl font-medium hover:bg-slate-200 transition-all">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all">Create Deal</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewEventModal({ leads, onClose, onSaved }: { leads: Lead[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", event_type: "meeting", start_time: "", end_time: "", location: "", lead_id: "" });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/crm/events", {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(form),
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="crm-card-3d rounded-2xl p-8 w-full max-w-[min(95vw,32rem)] shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900 mb-6">New Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Title *</label>
            <input required className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
              <select className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                {["meeting", "call", "task", "reminder", "deadline"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Linked Lead</label>
              <select className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>
                <option value="">None</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Start *</label>
              <input type="datetime-local" required className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">End *</label>
              <input type="datetime-local" required className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Location</label>
            <input className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/80 text-slate-500 rounded-xl font-medium hover:bg-slate-200">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all">Create Event</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewCommModal({ leads, onClose, onSaved }: { leads: Lead[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ lead_id: "", comm_type: "email", direction: "outbound", subject: "", body: "" });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/crm/communications", {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(form),
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="crm-card-3d rounded-2xl p-8 w-full max-w-[min(95vw,32rem)] shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900 mb-6">Log Communication</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
              <select className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none" value={form.comm_type} onChange={e => setForm({ ...form, comm_type: e.target.value })}>
                {["email", "phone", "sms", "whatsapp", "meeting", "note"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Direction</label>
              <select className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none" value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Lead</label>
            <select className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>
              <option value="">Select lead...</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
            <input className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Notes / Body</label>
            <textarea rows={4} className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 resize-none" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/80 text-slate-500 rounded-xl font-medium hover:bg-slate-200">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all">Log Communication</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewInvoiceModal({ leads, onClose, onSaved }: { leads: Lead[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ lead_id: "", type: "quote", tax_rate: "24", notes: "" });
  const [items, setItems] = useState<{ description: string; quantity: number; unit_price: number }[]>([{ description: "", quantity: 1, unit_price: 0 }]);

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  const updateItem = (i: number, field: string, val: any) => {
    const newItems = [...items];
    (newItems[i] as any)[field] = field === "description" ? val : parseFloat(val) || 0;
    setItems(newItems);
  };
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((s, item) => s + item.quantity * item.unit_price, 0);
  const tax = subtotal * ((parseFloat(form.tax_rate) || 24) / 100);
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/crm/invoices", {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ...form, items, tax_rate: parseFloat(form.tax_rate) || 24 }),
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="crm-card-3d rounded-2xl p-8 w-full max-w-[min(95vw,42rem)] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900 mb-6">New Quote / Invoice</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
              <select className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="quote">Quote</option>
                <option value="invoice">Invoice</option>
                <option value="proforma">Proforma</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Client</label>
              <select className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>
                <option value="">Select client...</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-500">Line Items</label>
              <button type="button" onClick={addItem} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input placeholder="Description" className="flex-1 p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} />
                  <input type="number" placeholder="Qty" className="w-20 p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} />
                  <input type="number" placeholder="Price €" className="w-28 p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none" value={item.unit_price} onChange={e => updateItem(i, "unit_price", e.target.value)} />
                  {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="p-3 text-red-500 hover:text-red-700">✕</button>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tax Rate (%)</label>
              <input type="number" className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} />
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-slate-100/80 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs text-slate-500"><span>Subtotal</span><span>€{subtotal.toLocaleString("el-GR")}</span></div>
                <div className="flex justify-between text-xs text-slate-500"><span>Tax ({form.tax_rate}%)</span><span>€{tax.toLocaleString("el-GR")}</span></div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1"><span>Total</span><span>€{total.toLocaleString("el-GR")}</span></div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
            <textarea rows={2} className="w-full p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none resize-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/80 text-slate-500 rounded-xl font-medium hover:bg-slate-200">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all">Create {form.type}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── NOTIFICATIONS VIEW ─── */
function NotificationsView({ notifications, onRefresh }: { notifications: any[]; onRefresh: () => void }) {
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Config Panel */}
      <div className="crm-card-3d rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Webhook Configuration</h3>
            <p className="text-xs text-slate-500 mt-1">Supabase Database Webhook → Slack + Email alerts</p>
          </div>
          <button onClick={() => setConfigOpen(!configOpen)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-all">
            {configOpen ? "Hide" : "Configure"}
          </button>
        </div>

        {configOpen && (
          <div className="space-y-4 pt-4 border-t border-slate-200/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-100/80 rounded-xl p-4">
                <h4 className="text-xs font-bold text-green-700 mb-2">✅ Slack Notifications</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="text-green-700 font-medium">Active</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Channel</span><span className="text-slate-600">#Agapitos</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Trigger</span><span className="text-slate-600">INSERT on public.leads</span></div>
                </div>
              </div>
              <div className="bg-slate-100/80 rounded-xl p-4">
                <h4 className="text-xs font-bold text-blue-700 mb-2">✅ Email Notifications</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Status</span><span className="text-green-700 font-medium">Active</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">To</span><span className="text-slate-600">kalafatasagapitos@gmail.com</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Provider</span><span className="text-slate-600">Resend API</span></div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100/50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-amber-600 mb-2">Setup Instructions</h4>
              <ol className="text-xs text-slate-500 space-y-1.5 list-decimal list-inside">
                <li>Go to <span className="text-slate-600">Supabase Dashboard → Integrations → Webhooks</span></li>
                <li>Create webhook: Table <span className="text-slate-600">public.leads</span>, Event <span className="text-slate-600">INSERT</span></li>
                <li>URL: <span className="text-slate-600">https://www.agapitoskalafatas.com/api/webhooks/lead-notification</span></li>
                <li>Header: <span className="text-slate-600">x-webhook-secret</span> = <span className="text-slate-600">(value set server-side in env <code>SUPABASE_WEBHOOK_SECRET</code>)</span></li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Notification Feed */}
      <div className="crm-card-3d rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200/60">
          <h3 className="text-sm font-bold text-slate-900">Recent Notifications</h3>
          <button onClick={onRefresh} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-all">
            ↻ Refresh
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3"> </div>
            <p className="text-slate-500 text-sm">No notifications yet</p>
            <p className="text-slate-600 text-xs mt-1">They will appear here when new leads are captured</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 hover:bg-slate-100/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
                    n.type === "slack" ? "bg-green-100 text-green-700" :
                    n.type === "email" ? "bg-blue-100 text-blue-700" :
                    "bg-purple-100 text-purple-700"
                  }`}>
                    {n.type === "slack" ? " " : n.type === "email" ? " " : " "}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        n.status === "sent" ? "bg-green-100 text-green-700" :
                        n.status === "failed" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {n.status}
                      </span>
                      <span className="text-xs text-slate-500">{n.type}</span>
                    </div>
                    <p className="text-sm text-slate-900 mt-1 truncate">{n.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(n.created_at).toLocaleString("el-GR")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsView() {
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [settings, setSettings] = useState({
    company_name: "Agapitos Kalafatas",
    vat_number: "",
    tax_office: "",
    address: "",
    bank_iban: "",
    slack_webhook_url: "",
    supabase_webhook_secret: "",
    notify_email: "kalafatasagapitos@gmail.com",
    ga_measurement_id: "",
    ai_system_prompt: "You tone and focus guidance for Atlas: You are professional, warm, concrete and concise. You speak the user's language (Greek or English). You help with technology services (e-shops, websites, SaaS, AI agents), energy (electricity, gas, photovoltaics, EV charging), and insurance (life, health, car, home). Use the company knowledge base and the user's CRM data for grounded answers. You never fabricate facts, prices, or statistics.",
    pipeline_stages: ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
  });

  const loadSettings = async () => {
    setLoading(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/settings", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          company_name: data.company_name || settings.company_name,
          vat_number: data.vat_number || "",
          tax_office: data.tax_office || "",
          address: data.address || "",
          bank_iban: data.bank_iban || "",
          slack_webhook_url: data.slack_webhook_url || "",
          supabase_webhook_secret: data.supabase_webhook_secret || "",
          notify_email: data.notify_email || settings.notify_email,
          ga_measurement_id: data.ga_measurement_id || "",
          ai_system_prompt: data.ai_system_prompt || settings.ai_system_prompt,
          pipeline_stages: Array.isArray(data.pipeline_stages) && data.pipeline_stages.length ? data.pipeline_stages : settings.pipeline_stages,
        });
      }
    } catch {
      // keep local values
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(settings),
      });
      if (res.ok) setSaveMsg("Settings saved successfully!");
      else setSaveMsg("Error saving settings");
    } catch {
      setSaveMsg("Error saving settings");
    }
    setSaving(false);
  };

  const inputCls = "w-full p-3 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-900";
  const labelCls = "block text-xs font-semibold uppercase text-slate-500 mb-2";

  const groups = [
    { key: "company", icon: "🏢", title: "Εταιρεία & Εμφάνιση", subtitle: "Στοιχεία, branding, χρήστες, GDPR", count: 4 },
    { key: "documents", icon: "📄", title: "Έγγραφα & Πρότυπα", subtitle: "Πρότυπα PDF προσφορών & εγγράφων", count: 1 },
    { key: "ai", icon: "🤖", title: "AI & Αυτοματισμοί", subtitle: "Agents, Orchestrator, Hub, Scraper", count: 3 },
    { key: "leads", icon: "💬", title: "Leads & Επικοινωνία", subtitle: "Pipelines, Email, SMS, Campaigns, Voice", count: 2 },
    { key: "data", icon: "📊", title: "Δεδομένα & Αναφορές", subtitle: "General, Τιμολόγια, Analytics", count: 1 },
  ];

  const filteredGroups = groups.filter((g) =>
    !query.trim() || (g.title + " " + g.subtitle).toLowerCase().includes(query.trim().toLowerCase())
  );

  const group = groups.find((g) => g.key === active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ρυθμίσεις & Integrations</h2>
          <p className="text-sm text-slate-500 mt-0.5">Διαχείριση εταιρείας, προτύπων, AI, επικοινωνίας & αναφορών</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
          <button onClick={loadSettings} disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white/70 hover:bg-white border border-slate-200/80 transition disabled:opacity-50">
            <span className={`inline-block ${loading ? "animate-spin" : ""}`}>↻</span> Reload
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md hover:shadow-lg transition disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {saveMsg && <div className="text-sm font-medium text-green-600">{saveMsg}</div>}

      {!group ? (
        <>
          {/* Search */}
          <div className="relative max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search settings…"
              className="w-full pl-11 pr-4 py-3.5 crm-card-3d rounded-2xl outline-none text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Category cards */}
          {filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredGroups.map((g) => (
                <button key={g.key} onClick={() => { setActive(g.key); setQuery(""); }}
                  className="crm-card-3d rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5">
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/60 flex items-center justify-center text-xl">{g.icon}</div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">{g.count} settings</span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{g.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{g.subtitle}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600">Άνοιγμα <span aria-hidden>→</span></span>
                </button>
              ))}
            </div>
          ) : (
            <div className="crm-card-3d rounded-2xl p-10 text-center text-sm text-slate-500">Δεν βρέθηκαν ρυθμίσεις για «{query}»</div>
          )}
        </>
      ) : (
        <>
          {/* Group detail */}
          <button onClick={() => { setActive(null); setSaveMsg(""); }}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition">
            ← Επιστροφή
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/60 flex items-center justify-center text-2xl">{group.icon}</div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{group.title}</h3>
              <p className="text-sm text-slate-500">{group.subtitle}</p>
            </div>
          </div>

          <div className="crm-card-3d rounded-2xl p-6 space-y-5">
            {active === "company" && (
              <>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Στοιχεία Εταιρείας</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Επωνυμία Εταιρείας</label><input className={inputCls} value={settings.company_name} onChange={(e) => setSettings({...settings, company_name: e.target.value})} /></div>
                  <div><label className={labelCls}>ΑΦΜ</label><input className={inputCls} value={settings.vat_number} onChange={(e) => setSettings({...settings, vat_number: e.target.value})} placeholder="Εισάγετε ΑΦΜ" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelCls}>ΔΟΥ</label><input className={inputCls} value={settings.tax_office} onChange={(e) => setSettings({...settings, tax_office: e.target.value})} placeholder="Εισάγετε ΔΟΥ" /></div>
                  <div><label className={labelCls}>Διεύθυνση</label><input className={inputCls} value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} placeholder="Εισάγετε διεύθυνση" /></div>
                </div>
              </>
            )}

            {active === "documents" && (
              <>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Πρότυπα Εγγράφων</h4>
                <div><label className={labelCls}>IBAN Τράπεζας (προσφορές & τιμολόγια)</label><input className={inputCls} value={settings.bank_iban} onChange={(e) => setSettings({...settings, bank_iban: e.target.value})} placeholder="GR00 0000 0000 0000 0000 0000 000" /></div>
              </>
            )}

            {active === "ai" && (
              <>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Agents & Αυτοματισμοί</h4>
                <div>
                  <label className={labelCls}>AI System Prompt</label>
                  <textarea rows={6} className={inputCls + " resize-none"} value={settings.ai_system_prompt} onChange={(e) => setSettings({...settings, ai_system_prompt: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Slack Webhook URL</label><input className={inputCls} value={settings.slack_webhook_url} onChange={(e) => setSettings({...settings, slack_webhook_url: e.target.value})} placeholder="https://hooks.slack.com/services/..." /></div>
                  <div><label className={labelCls}>Supabase Webhook Secret</label><input type="password" className={inputCls} value={settings.supabase_webhook_secret} onChange={(e) => setSettings({...settings, supabase_webhook_secret: e.target.value})} placeholder="••••••••••••" /></div>
                </div>
              </>
            )}

            {active === "leads" && (
              <>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Email & Pipelines</h4>
                <div>
                  <label className={labelCls}>Email Ειδοποιήσεων (Resend)</label>
                  <input className={inputCls} type="email" value={settings.notify_email} onChange={(e) => setSettings({...settings, notify_email: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Pipeline Stages</label>
                  <div className="flex flex-wrap gap-2">
                    {settings.pipeline_stages.map((stage, i) => (
                      <div key={i} className="flex items-center gap-1 bg-slate-100 rounded-lg px-3 py-1.5">
                        <input className="bg-transparent text-sm text-slate-700 outline-none w-28" value={stage} onChange={(e) => { const s = [...settings.pipeline_stages]; s[i] = e.target.value; setSettings({...settings, pipeline_stages: s}); }} />
                        <button onClick={() => setSettings({...settings, pipeline_stages: settings.pipeline_stages.filter((_, j) => j !== i)})} className="text-red-500 hover:text-red-700 text-xs">×</button>
                      </div>
                    ))}
                    <button onClick={() => setSettings({...settings, pipeline_stages: [...settings.pipeline_stages, "New Stage"]})} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">+ Add Stage</button>
                  </div>
                </div>
              </>
            )}

            {active === "data" && (
              <>
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Analytics</h4>
                <div><label className={labelCls}>Google Analytics ID</label><input className={inputCls} value={settings.ga_measurement_id} onChange={(e) => setSettings({...settings, ga_measurement_id: e.target.value})} placeholder="G-XXXXXXXXXX" /></div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md hover:shadow-lg transition disabled:opacity-50">
              {saving ? "Saving..." : "Save Settings"}
            </button>
            <button onClick={loadSettings} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white/70 hover:bg-white border border-slate-200/80 transition disabled:opacity-50">
              Reload
            </button>
            {saveMsg && <span className="text-sm text-green-600 font-medium">{saveMsg}</span>}
          </div>
        </>
      )}
    </div>
  );
}
