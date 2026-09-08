"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminAuth } from "@/components/admin/AdminAuthProvider";
import {
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  Check,
  X,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Unplug,
} from "lucide-react";

const PLATFORMS = ["facebook", "instagram", "youtube", "tiktok", "linkedin"] as const;
type Platform = (typeof PLATFORMS)[number];

type CapabilityRow = {
  id: string;
  label: string;
  kind: string;
  publish: boolean;
  description: string;
  appReviewNote?: string;
};

type ConnectionRow = {
  id: string;
  platform: string;
  account_name: string;
  account_id?: string;
  provider?: string;
  credential_service?: string | null;
  status: string;
  scopes?: string[];
  capabilities_declared?: string[];
  capabilities_verified?: string[];
  health?: {
    last_check_at?: string;
    ok?: boolean | null;
    message?: string;
    info?: Record<string, any>;
  } | null;
  effective?: {
    declared: string[];
    verified: string[];
    publishDeclared: string[];
    publishVerified: string[];
    canPublishNow: boolean;
  };
  created_at?: string;
  updated_at?: string;
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  connected: "bg-green-50 text-green-700 border-green-200",
  error: "bg-red-50 text-red-700 border-red-200",
  disabled: "bg-slate-100 text-slate-400 border-slate-200",
};

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${className}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status || "draft";
  return <Badge className={STATUS_STYLE[s] || STATUS_STYLE.draft}>{s}</Badge>;
}

export default function SocialSettingsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <SocialSettingsInner />
    </Suspense>
  );
}

function SocialSettingsInner() {
  const { token } = useAdminAuth();

  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [matrix, setMatrix] = useState<Record<string, CapabilityRow[]>>({});

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [platform, setPlatform] = useState<Platform>("facebook");
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [scopesText, setScopesText] = useState("");
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [probeId, setProbeId] = useState<string | null>(null);

  const api = useCallback(
    async (path: string, opts: RequestInit = {}) => {
      const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (opts.body) headers["Content-Type"] = "application/json";
      const res = await fetch(path, { ...opts, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      return data;
    },
    [token]
  );

  const loadMatrix = useCallback(
    async (platform?: Platform) => {
      try {
        const q = platform ? `?platform=${platform}` : "";
        const d = await api(`/api/social/capabilities${q}`);
        setMatrix(d.platforms || {});
      } catch (e) {
        setNotice(`Capabilities: ${e instanceof Error ? e.message : "load failed"}`);
      }
    },
    [api]
  );

  const loadConnections = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const d = await api("/api/social/connections");
      setConnections(d.connections || []);
    } catch (e) {
      setNotice(`Connections: ${e instanceof Error ? e.message : "load failed"}`);
    } finally {
      setLoading(false);
    }
  }, [api, token]);

  useEffect(() => {
    if (!token) {
      loadMatrix();
      return;
    }
    loadConnections();
    loadMatrix();
  }, [token, loadConnections, loadMatrix]);

  useEffect(() => {
    const caps = matrix[platform] || [];
    setSelectedCaps((prev) => prev.filter((id) => caps.some((c) => c.id === id)));
  }, [platform, matrix]);

  const toggleCap = (id: string) => {
    setSelectedCaps((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setNotice("Account name is required");
      return;
    }
    setCreating(true);
    setNotice("");
    try {
      await api("/api/social/connections", {
        method: "POST",
        body: JSON.stringify({
          platform,
          accountName: accountName.trim(),
          accountId: accountId.trim() || undefined,
          scopes: scopesText
            .split(/[,\s]+/)
            .map((s) => s.trim())
            .filter(Boolean),
          capabilitiesDeclared: selectedCaps,
          token: tokenInput.trim() || undefined,
        }),
      });
      setNotice("Connection saved. Run a read probe to verify capabilities.");
      setShowCreate(false);
      setAccountName("");
      setAccountId("");
      setTokenInput("");
      setScopesText("");
      setSelectedCaps([]);
      await loadConnections();
    } catch (e) {
      setNotice(`Create: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setCreating(false);
    }
  };

  const handleProbe = async (id: string) => {
    setProbeId(id);
    setNotice("");
    try {
      const d = await api(`/api/social/connections/${id}/probe`, { method: "POST" });
      setNotice(d.probe?.message || "Probe complete");
      await loadConnections();
    } catch (e) {
      setNotice(`Probe: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setProbeId(null);
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await api(`/api/social/connections/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadConnections();
    } catch (e) {
      setNotice(`Status: ${e instanceof Error ? e.message : "failed"}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this connection and any stored token?")) return;
    try {
      await api(`/api/social/connections/${id}`, { method: "DELETE" });
      await loadConnections();
      setNotice("Connection deleted");
    } catch (e) {
      setNotice(`Delete: ${e instanceof Error ? e.message : "failed"}`);
    }
  };

  return (
    <AdminShell
      breadcrumbs={[
        { label: "Atlas", href: "/admin/crm" },
        { label: "Marketing" },
        { label: "Social Accounts" },
      ]}
      headerRight={
        <button
          onClick={() => loadConnections()}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-slate-300 bg-white rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      }
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Social Connections</h1>
          <p className="text-sm text-slate-500 mt-1">
            Capability-first account connections. Publish stays disabled until a platform
            adapter is built and a read probe verifies authorization.
          </p>
        </div>

        {notice && (
          <div className="mb-4 flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            {notice}
          </div>
        )}

        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="mb-6 inline-flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" /> Add connection
          </button>
        ) : (
          <form
            onSubmit={handleCreate}
            className="mb-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">New connection</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Account name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. my-business-page"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Account ID / page ID (optional)
                </label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="e.g. 1234567890"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Scopes (comma or space separated, optional)
                </label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  value={scopesText}
                  onChange={(e) => setScopesText(e.target.value)}
                  placeholder="pages_read_posts, pages_messaging"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Token (optional). Stored encrypted under {`INTEGRATION_TOKEN_IS_PLAINTEXT`} opt-in,
                used only for safe read probes. Without it, connections stay draft/manual.
              </label>
              <input
                type="password"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="paste access token (never shown in browser JS afterwards)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">
                Declared capabilities (operator assertion — verification happens via read probe)
              </label>
              <div className="flex flex-wrap gap-2">
                {(matrix[platform] || []).map((cap) => (
                  <button
                    type="button"
                    key={cap.id}
                    onClick={() => toggleCap(cap.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border ${
                      selectedCaps.includes(cap.id)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                    }`}
                    title={cap.description + (cap.appReviewNote ? ` (${cap.appReviewNote})` : "")}
                  >
                    {cap.label}
                    {cap.publish && <ShieldCheck className="w-3 h-3" />}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Shielded entries are publish-related and gated until a platform adapter exists.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save connection
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-sm px-4 py-2 border border-slate-300 bg-white rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {connections.length === 0 && !loading && (
            <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300 text-slate-400 text-sm">
              No social connections yet. Add one to begin capability discovery.
            </div>
          )}

          {connections.map((c) => {
            const eff = c.effective || {
              declared: c.capabilities_declared || [],
              verified: c.capabilities_verified || [],
              publishDeclared: [],
              publishVerified: [],
              canPublishNow: false,
            };
            const healthOk = c.health?.ok;
            return (
              <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{c.account_name}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        {c.platform}
                        {c.account_id ? ` · ${c.account_id}` : ""}
                        {c.credential_service ? " · token stored" : " · no token (draft)"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleProbe(c.id)}
                      disabled={probeId === c.id}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-slate-300 bg-white rounded-md hover:bg-slate-50 disabled:opacity-50"
                    >
                      {probeId === c.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Probe
                    </button>
                    {c.status === "disabled" ? (
                      <button
                        onClick={() => handleStatus(c.id, "draft")}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-slate-300 bg-white rounded-md hover:bg-slate-50"
                      >
                        Enable
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatus(c.id, "disabled")}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-slate-300 bg-white rounded-md hover:bg-slate-50"
                      >
                        <Unplug className="w-3.5 h-3.5" /> Disable
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-red-200 text-red-600 bg-white rounded-md hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">
                      Declared capabilities ({eff.declared.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {eff.declared.length === 0 && <span className="text-xs text-slate-400">—</span>}
                      {eff.declared.map((id) => (
                        <Badge key={id} className="bg-slate-100 text-slate-600 border-slate-200">
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <p className="text-xs font-medium text-slate-500">Verified capabilities</p>
                      {
                        healthOk === true ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            <Check className="w-3 h-3 mr-0.5" /> read-probe
                          </Badge>
                        ) : healthOk === false ? (
                          <Badge className="bg-red-50 text-red-700 border-red-200">
                            <AlertTriangle className="w-3 h-3 mr-0.5" /> probe failed
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-400 border-slate-200">not verified</Badge>
                        )
                      }
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {eff.verified.length === 0 && <span className="text-xs text-slate-400">—</span>}
                      {eff.verified.map((id) => (
                        <Badge key={id} className="bg-green-50 text-green-700 border-green-200">
                          {id}
                        </Badge>
                      ))}
                    </div>
                    {eff.publishVerified.length > 0 && (
                      <p className="text-[11px] text-amber-600 mt-1.5">
                        Publish-verified: {eff.publishVerified.join(", ")}. Publish remains disabled.
                      </p>
                    )}
                    {c.health?.message && (
                      <p className="text-[11px] text-slate-400 mt-1.5">{c.health.message}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}