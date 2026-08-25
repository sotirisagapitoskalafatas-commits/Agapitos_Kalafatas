"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Lead {
  id: string;
  created_at: string;
  client_name: string;
  client_contact: string;
  project_details: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  "In Progress": "bg-purple-50 text-purple-700 border-purple-200",
  Won: "bg-green-50 text-green-700 border-green-200",
  Lost: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (e) {
      setError("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
              ← Home
            </Link>
            <div className="w-px h-6 bg-slate-200" />
            <h1 className="text-slate-900 font-semibold text-lg">CRM Lead Management</h1>
          </div>
          <button
            onClick={fetchLeads}
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {["New", "Contacted", "In Progress", "Won", "Lost"].map((status) => (
            <div key={status} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-2xl font-bold text-slate-900">
                {leads.filter((l) => l.status === status).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">{status}</p>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-20 text-slate-400">Loading leads...</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm mb-6">
            {error}
          </div>
        )}

        {!loading && !error && leads.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4"> </p>
            <p className="text-slate-500 text-lg">No leads yet</p>
            <p className="text-slate-400 text-sm mt-2">
              Leads will appear here when users interact with Atlas AI on your website.
            </p>
          </div>
        )}

        {!loading && leads.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Project Details</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {lead.client_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-600">
                      {lead.client_contact}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {lead.project_details || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs rounded-full font-medium border ${
                          STATUS_COLORS[lead.status] || "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
