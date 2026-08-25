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
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (token) {
      setAuthenticated(true);
      fetchLeads(token);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("crm_token", data.token);
        setAuthenticated(true);
        fetchLeads(data.token);
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch (e) {
      setLoginError("Connection error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_token");
    setAuthenticated(false);
    setLeads([]);
    setUsername("");
    setPassword("");
  };

  const fetchLeads = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.leads) {
        setLeads(data.leads);
        setError("");
      } else if (data.error) {
        setError(data.error);
        if (res.status === 401) {
          handleLogout();
        }
      }
    } catch (e) {
      setError("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  // Login Form
  if (!authenticated) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/25">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">CRM Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Sign in to manage your leads</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-brand-500/25"
              >
                {loginLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                ← Back to website
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Dashboard
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-slate-900 transition-colors">
              ← Home
            </Link>
            <div className="w-px h-6 bg-slate-200" />
            <h1 className="text-slate-900 font-semibold text-lg">CRM Lead Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchLeads(localStorage.getItem("crm_token") || "")}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              Sign Out
            </button>
          </div>
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
