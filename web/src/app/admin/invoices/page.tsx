"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const InvoicePDFDownload = dynamic(
  () => import("@/components/crm/InvoicePDFDownload"),
  { ssr: false }
);

function invoiceAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  type: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  items: InvoiceItem[];
  notes: string;
  valid_until: string | null;
  created_at: string;
  leads?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  } | null;
}

interface CompanyDetails {
  company_name: string;
  vat_number: string;
  tax_office: string;
  address: string;
  bank_iban: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-600",
  paid: "bg-green-100 text-green-600",
  overdue: "bg-red-100 text-red-600",
  accepted: "bg-green-100 text-green-600",
  rejected: "bg-red-100 text-red-600",
  expired: "bg-slate-100 text-slate-400",
};

const TYPE_LABELS: Record<string, string> = {
  quote: "Quote",
  invoice: "Invoice",
  proforma: "Proforma",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState<CompanyDetails>({
    company_name: "Agapitos Kalafatas",
    vat_number: "",
    tax_office: "",
    address: "",
    bank_iban: "",
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const headers = invoiceAuthHeaders();

    const [invRes, settingsRes] = await Promise.all([
      fetch("/api/crm/invoices", { headers }).then(r => r.json()).catch(() => []),
      fetch("/api/crm/settings", { headers }).then(r => r.json()).catch(() => null),
    ]);

    if (Array.isArray(invRes)) setInvoices(invRes as Invoice[]);
    else if (!invRes.error && invRes.data) setInvoices(invRes.data as Invoice[]);

    if (settingsRes && !settingsRes.error && settingsRes.data) {
      const s = settingsRes.data;
      setCompany({
        company_name: s.company_name || "Agapitos Kalafatas",
        vat_number: s.vat_number || "",
        tax_office: s.tax_office || "",
        address: s.address || "",
        bank_iban: s.bank_iban || "",
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filtered = invoices.filter((inv) => {
    if (typeFilter !== "all" && inv.type !== typeFilter) return false;
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    return true;
  });

  const formatCurrency = (n: number) =>
    `€${n.toLocaleString("el-GR", { minimumFractionDigits: 0 })}`;

  const totalStats = {
    count: filtered.length,
    total: filtered.reduce((s, inv) => s + (inv.total || 0), 0),
    paid: filtered.filter((i) => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0),
    pending: filtered
      .filter((i) => ["draft", "sent"].includes(i.status))
      .reduce((s, i) => s + (i.total || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your invoices, quotes, and proformas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/crm"
              className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-2 rounded-xl hover:bg-slate-100 transition-all"
            >
              Back to CRM
            </a>
            <button
              onClick={() => setShowNewModal(true)}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25"
            >
              + New Invoice
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Documents", value: totalStats.count, color: "from-blue-500 to-cyan-500" },
            { label: "Total Value", value: formatCurrency(totalStats.total), color: "from-violet-500 to-purple-500" },
            { label: "Paid", value: formatCurrency(totalStats.paid), color: "from-green-500 to-emerald-500" },
            { label: "Pending", value: formatCurrency(totalStats.pending), color: "from-amber-500 to-orange-500" },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 transition-all"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-lg mb-3 shadow-lg`}
              >
                {c.label === "Total Documents"
                  ? " "
                  : c.label === "Paid"
                  ? "✅"
                  : c.label === "Pending"
                  ? " "
                  : " "}
              </div>
              <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              <p className="text-xs text-slate-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Filter:
            </span>
            <div className="flex gap-2">
              {["all", "quote", "invoice", "proforma"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${
                    typeFilter === t
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t === "all"
                    ? "All"
                    : TYPE_LABELS[t] || t}
                </button>
              ))}
            </div>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <div className="flex gap-2">
              {["all", "draft", "sent", "paid", "overdue"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === s
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3"> </div>
              <p className="text-slate-500 text-sm">No invoices found</p>
              <p className="text-slate-400 text-xs mt-1">
                Create your first invoice to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-4">Number</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-mono text-indigo-600 text-xs font-bold">
                          {inv.invoice_number}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 capitalize">
                          {TYPE_LABELS[inv.type] || inv.type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-900 text-sm">
                        {inv.leads
                          ? `${inv.leads.first_name} ${inv.leads.last_name}`
                          : "—"}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900">
                          €{(inv.total || 0).toLocaleString("el-GR")}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-xs">
                        {new Date(inv.created_at).toLocaleDateString("el-GR")}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                            STATUS_STYLES[inv.status] || "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <InvoicePDFDownload invoice={inv} company={company} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Invoice Modal */}
      {showNewModal && (
        <NewInvoiceModal
          onClose={() => setShowNewModal(false)}
          onSaved={() => {
            setShowNewModal(false);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}

function NewInvoiceModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [leads, setLeads] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [form, setForm] = useState({
    lead_id: "",
    type: "invoice",
    tax_rate: "24",
    notes: "",
  });
  const [items, setItems] = useState<{ description: string; quantity: number; unit_price: number }[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    const headers = invoiceAuthHeaders();
    fetch("/api/crm/leads", { headers })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? [];
        if (Array.isArray(list)) setLeads(list as { id: string; first_name: string; last_name: string }[]);
      })
      .catch(() => {});
  }, []);

  const addItem = () =>
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  const updateItem = (i: number, field: string, val: any) => {
    const newItems = [...items];
    (newItems[i] as any)[field] =
      field === "description" ? val : parseFloat(val) || 0;
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
      headers: invoiceAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        ...form,
        items,
        tax_rate: parseFloat(form.tax_rate) || 24,
      }),
    });
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white/90 backdrop-blur-lg border border-slate-200/80 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          New Invoice
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Type
              </label>
              <select
                className="w-full p-3 bg-white/60 border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="quote">Quote</option>
                <option value="invoice">Invoice</option>
                <option value="proforma">Proforma</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Client
              </label>
              <select
                className="w-full p-3 bg-white/60 border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40"
                value={form.lead_id}
                onChange={(e) => setForm({ ...form, lead_id: e.target.value })}
              >
                <option value="">Select client...</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.first_name} {l.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-600">
                Line Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    placeholder="Description"
                    className="flex-1 p-3 bg-white/60 border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(i, "description", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    className="w-20 p-3 bg-white/60 border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Price €"
                    className="w-28 p-3 bg-white/60 border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(i, "unit_price", e.target.value)
                    }
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="p-3 text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                className="w-full p-3 bg-white/60 border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/40"
                value={form.tax_rate}
                onChange={(e) =>
                  setForm({ ...form, tax_rate: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>€{subtotal.toLocaleString("el-GR")}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Tax ({form.tax_rate}%)</span>
                  <span>€{tax.toLocaleString("el-GR")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Total</span>
                  <span>€{total.toLocaleString("el-GR")}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              className="w-full p-3 bg-white/60 border border-slate-200/80 rounded-xl text-sm text-slate-900 outline-none resize-none focus:ring-2 focus:ring-indigo-500/40"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
            >
              Create {TYPE_LABELS[form.type] || form.type}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
