"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function CRMDashboard() {
  const [activeTab, setActiveTab] = useState<"new_lead" | "customer">("new_lead");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const token = btoa(`${loginUser}:${loginPass}`);
    setAuthToken(token);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    if (isLoggedIn) fetchLeads();
  }, [isLoggedIn]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  };

  const updateLeadStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      fetchLeads();
      if (selectedLead) setSelectedLead({ ...selectedLead, status: newStatus });
    }
  };

  const updateLeadNotes = async (id: string, notes: string) => {
    const { error } = await supabase
      .from("leads")
      .update({ notes })
      .eq("id", id);

    if (!error && selectedLead) {
      setSelectedLead({ ...selectedLead, notes });
    }
  };

  const filteredLeads = leads.filter((item) =>
    activeTab === "new_lead"
      ? item.status === "new_lead" || item.status === "contacted"
      : item.status === "customer"
  );

  const getServiceColor = (service: string) => {
    if (service.includes("SaaS") || service.includes("AI")) return "bg-purple-100 text-purple-700";
    if (service.includes("Ρεύμα") || service.includes("Φυσικό")) return "bg-yellow-100 text-yellow-700";
    if (service.includes("Φωτοβολταϊκά")) return "bg-green-100 text-green-700";
    if (service.includes("Ηλεκτροκίνηση")) return "bg-blue-100 text-blue-700";
    if (service.includes("Ασφάλεια")) return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  // Login screen
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/25">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">CRM Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Agapitos Kalafatas</p>
          </div>
          <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-4">
            {loginError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{loginError}</div>}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Username</label>
              <input
                type="text"
                required
                className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25">
              Login
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">CRM & Lead Hub</h1>
            <p className="text-sm text-slate-500">Agapitos Kalafatas Management System</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchLeads} className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors">
              ↻ Refresh
            </button>
            <button onClick={() => setIsLoggedIn(false)} className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors">
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("new_lead")}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "new_lead"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            📁 Νέα Leads ({leads.filter((l) => l.status !== "customer").length})
          </button>
          <button
            onClick={() => setActiveTab("customer")}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "customer"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            ⭐ Πελάτες ({leads.filter((l) => l.status === "customer").length})
          </button>
        </div>

        {/* Lead Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
              Φόρτωση...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-4xl mb-3"> </div>
              Δεν βρέθηκαν καταχωρήσεις.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="p-4">Ημερομηνία</th>
                    <th className="p-4">Ονοματεπώνυμο</th>
                    <th className="p-4">Τηλέφωνο</th>
                    <th className="p-4">Υπηρεσία</th>
                    <th className="p-4">Αρχεία</th>
                    <th className="p-4">Ενέργεια</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-brand-50/30 cursor-pointer transition-all"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="p-4 text-slate-400 text-xs">
                        {new Date(lead.created_at).toLocaleDateString("el-GR")}
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {lead.first_name} {lead.last_name}
                      </td>
                      <td className="p-4 font-mono text-brand-600 text-xs">{lead.phone}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs rounded-lg font-medium ${getServiceColor(lead.service_category)}`}>
                          {lead.service_category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        {lead.attached_files?.length ? `📎 ${lead.attached_files.length}` : "—"}
                      </td>
                      <td className="p-4">
                        <button className="text-xs bg-brand-50 text-brand-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">
                          Άνοιγμα Φακέλου
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

      {/* Client Folder Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50" onClick={() => setSelectedLead(null)}>
          <div
            className="bg-white w-full max-w-xl h-full p-8 shadow-2xl overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
                  Φάκελος # {selectedLead.id.substring(0, 8)}
                </span>
                <h2 className="text-2xl font-bold mt-2 text-slate-900">
                  {selectedLead.first_name} {selectedLead.last_name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(selectedLead.created_at).toLocaleDateString("el-GR")} • {new Date(selectedLead.created_at).toLocaleTimeString("el-GR")}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Status Switcher */}
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-500">Κατάσταση:</span>
              <button
                onClick={() => updateLeadStatus(selectedLead.id, "new_lead")}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedLead.status === "new_lead" ? "bg-brand-500 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                Νέο Lead
              </button>
              <button
                onClick={() => updateLeadStatus(selectedLead.id, "contacted")}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedLead.status === "contacted" ? "bg-yellow-500 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                Επικοινωνήθηκε
              </button>
              <button
                onClick={() => updateLeadStatus(selectedLead.id, "customer")}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedLead.status === "customer" ? "bg-green-500 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                ⭐ Πελάτης
              </button>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Τηλέφωνο</span>
                  <span className="font-semibold text-sm text-slate-900">{selectedLead.phone}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Email</span>
                  <span className="font-semibold text-sm text-slate-900">{selectedLead.email || "Δεν δηλώθηκε"}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl">
                <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Υπηρεσία Ενδιαφέροντος</span>
                <span className={`inline-block px-2.5 py-1 text-xs rounded-lg font-medium ${getServiceColor(selectedLead.service_category)}`}>
                  {selectedLead.service_category}
                </span>
              </div>

              {selectedLead.property_type && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Τύπος Ακινήτου</span>
                    <span className="text-sm">{selectedLead.property_type}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Περιοχή</span>
                    <span className="text-sm">{selectedLead.region || "N/A"}</span>
                  </div>
                </div>
              )}

              {selectedLead.comments && (
                <div className="bg-slate-50 p-3.5 rounded-xl">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Σχόλια Πελάτη</span>
                  <p className="text-sm text-slate-700 italic">{selectedLead.comments}</p>
                </div>
              )}
            </div>

            {/* Uploaded Files */}
            <div>
              <h3 className="font-bold mb-3 text-xs uppercase text-slate-400">Επισυναπτόμενα Αρχεία</h3>
              {selectedLead.attached_files && selectedLead.attached_files.length > 0 ? (
                <div className="space-y-2">
                  {selectedLead.attached_files.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 bg-brand-50 border border-brand-100 rounded-xl text-brand-700 hover:bg-brand-100 transition-all text-xs font-semibold"
                    >
                      <span> {file.name}</span>
                      <span>Λήψη →</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">Δεν υπάρχουν επισυναπτόμενα αρχεία.</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <h3 className="font-bold mb-2 text-xs uppercase text-slate-400">Σημειώσεις</h3>
              <textarea
                rows={3}
                className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm resize-none transition-all"
                placeholder="Προσθέστε σημειώσεις για τον πελάτη..."
                value={selectedLead.notes || ""}
                onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                onBlur={() => {
                  if (selectedLead) updateLeadNotes(selectedLead.id, selectedLead.notes || "");
                }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
