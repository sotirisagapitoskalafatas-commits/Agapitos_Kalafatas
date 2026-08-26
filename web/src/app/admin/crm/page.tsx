"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

type Tab = "dashboard" | "leads" | "pipeline" | "calendar" | "comms" | "invoices" | "analytics";

const STAGES = [
  { key: "lead", label: "Lead", color: "bg-slate-100 border-slate-300" },
  { key: "qualified", label: "Qualified", color: "bg-blue-50 border-blue-300" },
  { key: "proposal", label: "Proposal", color: "bg-yellow-50 border-yellow-300" },
  { key: "negotiation", label: "Negotiation", color: "bg-orange-50 border-orange-300" },
  { key: "closed_won", label: "Won", color: "bg-green-50 border-green-300" },
  { key: "closed_lost", label: "Lost", color: "bg-red-50 border-red-300" },
];

const STATUS_COLORS: Record<string, string> = {
  new_lead: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  customer: "bg-green-100 text-green-700",
  archived: "bg-slate-100 text-slate-500",
};

const COMM_ICONS: Record<string, string> = {
  email: " ", phone: " ", sms: " ", whatsapp: " ", meeting: " ", note: " ",
};

export default function CRMDashboard() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [comms, setComms] = useState<CommRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showNewComm, setShowNewComm] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === "agapitos" && loginPass === "atlas2026") {
      setAuthToken(btoa(`${loginUser}:${loginPass}`));
      setIsLoggedIn(true);
    } else {
      setLoginError("Invalid credentials");
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
    const [leadsRes, dealsRes, eventsRes, commsRes, invRes, dashRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      fetch("/api/crm/deals").then(r => r.json()).catch(() => []),
      fetch("/api/crm/events").then(r => r.json()).catch(() => []),
      fetch("/api/crm/communications").then(r => r.json()).catch(() => []),
      fetch("/api/crm/invoices").then(r => r.json()).catch(() => []),
      fetch("/api/crm/dashboard").then(r => r.json()).catch(() => null),
    ]);

    if (!leadsRes.error && leadsRes.data) setLeads(leadsRes.data as Lead[]);
    if (dealsRes && !dealsRes.error) setDeals(dealsRes);
    if (eventsRes && !eventsRes.error) setEvents(eventsRes);
    if (commsRes && !commsRes.error) setComms(commsRes);
    if (invRes && !invRes.error) setInvoices(invRes);
    if (dashRes) setDashboard(dashRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchAll();
  }, [isLoggedIn, fetchAll]);

  const updateLeadStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", id);
    fetchAll();
    if (selectedLead) setSelectedLead({ ...selectedLead, status });
  };

  const updateLeadNotes = async (id: string, notes: string) => {
    await supabase.from("leads").update({ notes }).eq("id", id);
    if (selectedLead) setSelectedLead({ ...selectedLead, notes });
  };

  const moveDeal = async (id: string, stage: string) => {
    await fetch("/api/crm/deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage }),
    });
    fetchAll();
  };

  const toggleEventComplete = async (id: string, completed: boolean) => {
    await fetch("/api/crm/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, completed: !completed }),
    });
    fetchAll();
  };

  const formatCurrency = (n: number) => `€${n.toLocaleString("el-GR", { minimumFractionDigits: 0 })}`;

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-white">CRM Pro</h1>
            <p className="text-sm text-slate-400 mt-1">Agapitos Kalafatas</p>
          </div>
          <form onSubmit={handleLogin} className="bg-slate-800/80 backdrop-blur p-8 rounded-3xl border border-slate-700/50 shadow-2xl space-y-4">
            {loginError && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">{loginError}</div>}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Username</label>
              <input type="text" required className="w-full p-3.5 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-white" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Password</label>
              <input type="password" required className="w-full p-3.5 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-white" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} />
            </div>
            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25">
              Login
            </button>
          </form>
        </div>
      </main>
    );
  }

  const kpis = dashboard?.kpis;

  return (
    <main className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-30">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">CRM Pro</h1>
              <p className="text-[10px] text-slate-500">Agapitos Kalafatas</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {([
            { key: "dashboard" as Tab, label: "Dashboard", icon: " " },
            { key: "leads" as Tab, label: "Leads", icon: " " },
            { key: "pipeline" as Tab, label: "Pipeline", icon: " " },
            { key: "calendar" as Tab, label: "Calendar", icon: " " },
            { key: "comms" as Tab, label: "Communications", icon: " " },
            { key: "invoices" as Tab, label: "Invoices", icon: " " },
            { key: "analytics" as Tab, label: "Analytics", icon: " " },
          ]).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === item.key
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => { setIsLoggedIn(false); localStorage.removeItem("crm_token"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">{tab}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {new Date().toLocaleDateString("el-GR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button onClick={fetchAll} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors px-4 py-2 rounded-xl hover:bg-indigo-500/10">
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
            {tab === "leads" && <LeadsView leads={leads} onSelect={setSelectedLead} updateStatus={updateLeadStatus} />}
            {tab === "pipeline" && <PipelineView deals={deals} onMove={moveDeal} onNewDeal={() => setShowNewDeal(true)} />}
            {tab === "calendar" && <CalendarView events={events} onToggle={toggleEventComplete} onNew={() => setShowNewEvent(true)} />}
            {tab === "comms" && <CommsView comms={comms} onNew={() => setShowNewComm(true)} />}
            {tab === "invoices" && <InvoicesView invoices={invoices} onNew={() => setShowNewInvoice(true)} />}
            {tab === "analytics" && <AnalyticsView dashboard={dashboard} leads={leads} deals={deals} invoices={invoices} formatCurrency={formatCurrency} />}
          </>
        )}
      </div>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} updateStatus={updateLeadStatus} updateNotes={updateLeadNotes} />
      )}

      {/* Modals */}
      {showNewDeal && <NewDealModal leads={leads} onClose={() => setShowNewDeal(false)} onSaved={() => { setShowNewDeal(false); fetchAll(); }} />}
      {showNewEvent && <NewEventModal leads={leads} onClose={() => setShowNewEvent(false)} onSaved={() => { setShowNewEvent(false); fetchAll(); }} />}
      {showNewComm && <NewCommModal leads={leads} onClose={() => setShowNewComm(false)} onSaved={() => { setShowNewComm(false); fetchAll(); }} />}
      {showNewInvoice && <NewInvoiceModal leads={leads} onClose={() => setShowNewInvoice(false)} onSaved={() => { setShowNewInvoice(false); fetchAll(); }} />}
    </main>
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
          <div key={c.label} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-lg mb-3 shadow-lg`}>
              {c.icon}
            </div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Breakdown */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Leads by Service</h3>
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
                        <span className="text-slate-300">{service}</span>
                        <span className="text-slate-500">{count}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Pipeline Stages */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Pipeline Stages</h3>
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
                      <span className="text-slate-300">{s.label}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
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
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Recent Activity</h3>
        {data.recentActivity.length === 0 ? (
          <p className="text-slate-600 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {data.recentActivity.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-xs">
                  {a.entity_type === "deal" ? " " : a.entity_type === "invoice" ? " " : " "}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{a.action} {a.entity_type}</p>
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

/* ─── LEADS VIEW ─── */
function LeadsView({ leads, onSelect, updateStatus }: { leads: Lead[]; onSelect: (l: Lead) => void; updateStatus: (id: string, s: string) => void }) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = leads.filter(l => {
    if (filter !== "all" && l.status !== filter) return false;
    const q = search.toLowerCase();
    if (q && !`${l.first_name} ${l.last_name} ${l.phone} ${l.email} ${l.service_category}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search leads..."
          className="flex-1 min-w-[200px] p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {["all", "new_lead", "contacted", "customer", "archived"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${
              filter === s ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {s === "all" ? "All" : s === "new_lead" ? "New" : s === "contacted" ? "Contacted" : s === "customer" ? "Customers" : "Archived"} ({s === "all" ? leads.length : leads.filter(l => l.status === s).length})
          </button>
        ))}
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 border-b border-slate-700 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/30 cursor-pointer transition-all" onClick={() => onSelect(lead)}>
                    <td className="p-4 text-slate-500 text-xs">{new Date(lead.created_at).toLocaleDateString("el-GR")}</td>
                    <td className="p-4 font-semibold text-white">{lead.first_name} {lead.last_name}</td>
                    <td className="p-4 font-mono text-indigo-400 text-xs">{lead.phone}</td>
                    <td className="p-4 text-slate-400 text-xs">{lead.email || "—"}</td>
                    <td className="p-4"><span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">{lead.service_category}</span></td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${STATUS_COLORS[lead.status] || ""}`}>
                        {lead.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="text-xs bg-indigo-500/10 text-indigo-400 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors">
                        Open
                      </button>
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
                  <div key={deal.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/50">
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
                {stageDeals.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No deals</p>}
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
          <button onClick={() => setWeekOffset(0)} className="text-xs bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl font-medium">Today</button>
          <button onClick={() => setWeekOffset(w => w - 1)} className="text-xs bg-slate-800 text-slate-400 px-3 py-2 rounded-xl hover:bg-slate-700">←</button>
          <span className="text-sm font-bold text-white">
            {days[0].toLocaleDateString("el-GR", { month: "short", day: "numeric" })} — {days[6].toLocaleDateString("el-GR", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="text-xs bg-slate-800 text-slate-400 px-3 py-2 rounded-xl hover:bg-slate-700">→</button>
        </div>
        <button onClick={onNew} className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl">+ New Event</button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-8 border-b border-slate-800">
          <div className="p-3 text-[10px] text-slate-600 uppercase font-bold">Time</div>
          {days.map((d, i) => (
            <div key={i} className={`p-3 text-center border-l border-slate-800 ${d.toDateString() === today.toDateString() ? "bg-indigo-500/10" : ""}`}>
              <p className="text-[10px] text-slate-500 uppercase font-bold">{d.toLocaleDateString("el-GR", { weekday: "short" })}</p>
              <p className={`text-lg font-bold ${d.toDateString() === today.toDateString() ? "text-indigo-400" : "text-white"}`}>{d.getDate()}</p>
            </div>
          ))}
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {hours.map(h => (
            <div key={h} className="grid grid-cols-8 border-b border-slate-800/50">
              <div className="p-2 text-[10px] text-slate-600 font-mono">{`${String(h).padStart(2, "0")}:00`}</div>
              {days.map((d, di) => {
                const dayEvents = getEventsForDay(d).filter(e => {
                  const eH = new Date(e.start_time).getHours();
                  return eH === h;
                });
                return (
                  <div key={di} className="border-l border-slate-800/50 p-1 min-h-[40px]">
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
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        {comms.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No communications logged yet.</div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {comms.map(c => (
              <div key={c.id} className="p-4 hover:bg-slate-800/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-sm">{COMM_ICONS[c.comm_type] || " "}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{c.subject || c.comm_type}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.direction === "inbound" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {c.direction}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">{c.comm_type}</span>
                    </div>
                    {c.leads && <p className="text-xs text-slate-500 mt-1">{c.leads.first_name} {c.leads.last_name}</p>}
                    {c.body && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.body}</p>}
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
    rejected: "bg-red-100 text-red-600", paid: "bg-emerald-100 text-emerald-600", expired: "bg-slate-100 text-slate-400",
  };

  const updateInvoiceStatus = async (id: string, status: string) => {
    await fetch("/api/crm/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    onNew();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["all", "quote", "invoice", "proforma"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${typeFilter === t ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)} ({t === "all" ? invoices.length : invoices.filter(i => i.type === t).length})
            </button>
          ))}
        </div>
        <button onClick={onNew} className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl">+ New Quote/Invoice</button>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No invoices or quotes yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 border-b border-slate-700 text-slate-400 uppercase text-[10px] font-bold">
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
                  <tr key={inv.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-mono text-indigo-400 text-xs font-bold">{inv.invoice_number}</td>
                    <td className="p-4"><span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 capitalize">{inv.type}</span></td>
                    <td className="p-4 text-white text-sm">{inv.leads ? `${inv.leads.first_name} ${inv.leads.last_name}` : "—"}</td>
                    <td className="p-4 text-white font-bold">€{(inv.total || 0).toLocaleString("el-GR")}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusColors[inv.status] || ""}`}>{inv.status}</span>
                    </td>
                    <td className="p-4">
                      <select
                        className="text-[10px] bg-slate-800 text-slate-300 rounded-lg px-2 py-1.5 border-0 outline-none cursor-pointer"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Lead Sources by Service</h3>
          <div className="space-y-3">
            {Object.entries(dashboard.serviceBreakdown).map(([s, c]) => (
              <div key={s} className="flex justify-between items-center">
                <span className="text-xs text-slate-300">{s}</span>
                <span className="text-xs font-bold text-white">{c}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Deal Win Rate</h3>
          <div className="text-center py-4">
            <p className="text-5xl font-bold text-indigo-400">{winRate}%</p>
            <p className="text-xs text-slate-500 mt-2">{wonDeals.length} won / {lostDeals.length} lost / {deals.length} total</p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Revenue Summary</h3>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Pipeline</p>
              <p className="text-lg font-bold text-amber-400">{formatCurrency(dashboard.kpis.pipelineValue)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Won</p>
              <p className="text-lg font-bold text-green-400">{formatCurrency(dashboard.kpis.wonRevenue)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Paid Invoices</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(dashboard.kpis.paidInvoices)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Pending</p>
              <p className="text-lg font-bold text-yellow-400">{formatCurrency(dashboard.kpis.pendingInvoices)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Leads Chart */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Monthly Leads</h3>
        <div className="flex items-end gap-3 h-48">
          {Object.entries(monthlyLeads).slice(-12).map(([month, count]) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-400 font-bold">{count}</span>
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

/* ─── LEAD DRAWER ─── */
function LeadDrawer({ lead, onClose, updateStatus, updateNotes }: { lead: Lead; onClose: () => void; updateStatus: (id: string, s: string) => void; updateNotes: (id: string, n: string) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-xl h-full shadow-2xl overflow-y-auto border-l border-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-semibold uppercase text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">Lead #{lead.id.substring(0, 8)}</span>
              <h2 className="text-2xl font-bold mt-2 text-white">{lead.first_name} {lead.last_name}</h2>
              <p className="text-xs text-slate-500 mt-1">{new Date(lead.created_at).toLocaleString("el-GR")}</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors">✕</button>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            {["new_lead", "contacted", "customer", "archived"].map(s => (
              <button
                key={s}
                onClick={() => updateStatus(lead.id, s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  lead.status === s ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/30">
              <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Phone</span>
              <span className="font-semibold text-sm text-white">{lead.phone}</span>
            </div>
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/30">
              <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Email</span>
              <span className="font-semibold text-sm text-white">{lead.email || "Not provided"}</span>
            </div>
          </div>

          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/30">
            <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Service</span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300">{lead.service_category}</span>
          </div>

          {lead.attached_files?.length > 0 && (
            <div>
              <h3 className="font-bold mb-3 text-xs uppercase text-slate-500">Attached Files</h3>
              <div className="space-y-2">
                {lead.attached_files.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-indigo-400 hover:bg-indigo-500/10 transition-all text-xs font-semibold">
                    <span>{f.name}</span>
                    <span>Download →</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-bold mb-2 text-xs uppercase text-slate-500">Notes</h3>
            <textarea
              rows={4}
              className="w-full p-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-white resize-none"
              placeholder="Add notes about this lead..."
              defaultValue={lead.notes || ""}
              onBlur={(e) => updateNotes(lead.id, e.target.value)}
            />
          </div>
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, value: parseFloat(form.value) || 0 }),
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-6">New Deal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Deal Title *</label>
            <input required className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Value (€)</label>
              <input type="number" className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Expected Close</label>
              <input type="date" className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" value={form.expected_close_date} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Linked Lead</label>
            <select className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>
              <option value="">None</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-medium hover:bg-slate-700 transition-all">Cancel</button>
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-6">New Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Title *</label>
            <input required className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
              <select className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                {["meeting", "call", "task", "reminder", "deadline"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Linked Lead</label>
              <select className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>
                <option value="">None</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Start *</label>
              <input type="datetime-local" required className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">End *</label>
              <input type="datetime-local" required className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Location</label>
            <input className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-medium hover:bg-slate-700">Cancel</button>
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-6">Log Communication</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
              <select className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none" value={form.comm_type} onChange={e => setForm({ ...form, comm_type: e.target.value })}>
                {["email", "phone", "sms", "whatsapp", "meeting", "note"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Direction</label>
              <select className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none" value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Lead</label>
            <select className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>
              <option value="">Select lead...</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Subject</label>
            <input className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Notes / Body</label>
            <textarea rows={4} className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-medium hover:bg-slate-700">Cancel</button>
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items, tax_rate: parseFloat(form.tax_rate) || 24 }),
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-6">New Quote / Invoice</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
              <select className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="quote">Quote</option>
                <option value="invoice">Invoice</option>
                <option value="proforma">Proforma</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Client</label>
              <select className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>
                <option value="">Select client...</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-400">Line Items</label>
              <button type="button" onClick={addItem} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input placeholder="Description" className="flex-1 p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} />
                  <input type="number" placeholder="Qty" className="w-20 p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} />
                  <input type="number" placeholder="Price €" className="w-28 p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none" value={item.unit_price} onChange={e => updateItem(i, "unit_price", e.target.value)} />
                  {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="p-3 text-red-400 hover:text-red-300">✕</button>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tax Rate (%)</label>
              <input type="number" className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: e.target.value })} />
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-1">
                <div className="flex justify-between text-xs text-slate-400"><span>Subtotal</span><span>€{subtotal.toLocaleString("el-GR")}</span></div>
                <div className="flex justify-between text-xs text-slate-400"><span>Tax ({form.tax_rate}%)</span><span>€{tax.toLocaleString("el-GR")}</span></div>
                <div className="flex justify-between text-sm font-bold text-white border-t border-slate-700 pt-1"><span>Total</span><span>€{total.toLocaleString("el-GR")}</span></div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Notes</label>
            <textarea rows={2} className="w-full p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white outline-none resize-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-medium hover:bg-slate-700">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all">Create {form.type}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
