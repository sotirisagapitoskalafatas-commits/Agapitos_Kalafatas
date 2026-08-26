"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Lead {
  id: string;
  created_at: string;
  source: string | null;
  service_category: string;
  status: string;
}

interface Invoice {
  id: string;
  status: string;
  total: number;
  created_at: string;
}

interface Deal {
  id: string;
  stage: string;
  value: number;
  created_at: string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#6d28d9", "#4f46e5", "#7c3aed"];

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [leadsRes, invoicesRes, dealsRes] = await Promise.all([
        supabase.from("leads").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("deals").select("*"),
      ]);

      if (!leadsRes.error && leadsRes.data) setLeads(leadsRes.data as Lead[]);
      if (!invoicesRes.error && invoicesRes.data) setInvoices(invoicesRes.data as Invoice[]);
      if (!dealsRes.error && dealsRes.data) setDeals(dealsRes.data as Deal[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const formatCurrency = (n: number) =>
    `€${n.toLocaleString("el-GR", { minimumFractionDigits: 0 })}`;

  const totalLeads = leads.length;
  const wonDeals = deals.filter((d) => d.stage === "closed_won");
  const lostDeals = deals.filter((d) => d.stage === "closed_lost");
  const totalWonRevenue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
  const winRate =
    wonDeals.length + lostDeals.length > 0
      ? ((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100).toFixed(1)
      : "0";
  const activePipelineValue = deals
    .filter((d) => !["closed_won", "closed_lost"].includes(d.stage))
    .reduce((s, d) => s + (d.value || 0), 0);

  // Monthly revenue (last 6 months from paid invoices)
  const now = new Date();
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    const total = invoices
      .filter((inv) => {
        const dt = new Date(inv.created_at);
        return (
          inv.status === "paid" &&
          dt.getMonth() === d.getMonth() &&
          dt.getFullYear() === d.getFullYear()
        );
      })
      .reduce((s, inv) => s + (inv.total || 0), 0);
    monthlyRevenue.push({ month: label, revenue: total });
  }

  // Lead sources pie
  const sourceMap: Record<string, number> = {};
  leads.forEach((l) => {
    const src = l.source || l.service_category || "Unknown";
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const leadSources = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));

  // Lead trends (last 12 months)
  const leadTrends: { month: string; leads: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    const count = leads.filter((l) => {
      const dt = new Date(l.created_at);
      return dt.getMonth() === d.getMonth() && dt.getFullYear() === d.getFullYear();
    }).length;
    leadTrends.push({ month: label, leads: count });
  }

  // Pipeline stages
  const stageMap: Record<string, number> = {};
  deals.forEach((d) => {
    stageMap[d.stage] = (stageMap[d.stage] || 0) + 1;
  });
  const pipelineData = Object.entries(stageMap).map(([stage, count]) => ({
    stage: stage.replace("_", " "),
    count,
  }));

  const metricCards = [
    { label: "Total Leads", value: totalLeads.toLocaleString(), icon: " " },
    { label: "Won Revenue", value: formatCurrency(totalWonRevenue), icon: " " },
    { label: "Win Rate", value: `${winRate}%`, icon: " " },
    { label: "Pipeline Value", value: formatCurrency(activePipelineValue), icon: " " },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">CRM data overview</p>
          </div>
          <Link
            href="/admin/crm"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            ← Back to CRM
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((c) => (
            <div
              key={c.label}
              className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-sm"
            >
              <div className="text-2xl mb-2">{c.icon}</div>
              <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              <p className="text-xs text-slate-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Bar Chart */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Monthly Revenue (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Sources Donut */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Lead Sources</h3>
            {leadSources.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {leadSources.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Lead Trends Line Chart */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Lead Trends (Last 12 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={leadTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pipeline Stages Bar Chart */}
          <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Pipeline Stages</h3>
            {pipelineData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">No deals</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
