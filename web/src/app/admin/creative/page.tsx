"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  FileText,
  Check,
  X,
  Loader2,
  Upload,
  RefreshCw,
  ShieldCheck,
  Copy,
} from "lucide-react";

type CampaignRow = {
  id: string;
  name: string;
  service?: string;
  audience?: string;
  objective?: string;
  tone?: string;
  language?: string;
  status?: string;
  created_at?: string;
};

type VariantRow = {
  id: string;
  platform: string;
  language: string;
  headline?: string;
  primary_text?: string;
  short_text?: string;
  cta?: string;
  hashtags?: string[];
  alt_text?: string;
  status: string;
};

type AssetRow = {
  id: string;
  asset_type: string;
  kind: string;
  title: string;
  status: string;
  prompt?: string;
  asset_path?: string;
  mime_type?: string;
  source_path?: string;
  model?: string;
  language?: string;
  platforms?: string[];
  tags?: string[];
  checks?: {
    brand_checks?: { rule_name: string; passed: boolean; severity: string }[];
    deterministic_pii?: { found: boolean; matches: string[] };
    compliance?: { needs_human_review: boolean; flags: unknown[] };
    summary?: string;
  };
  meta?: Record<string, any>;
  campaign_id?: string;
  created_at?: string;
  updated_at?: string;
  variants?: VariantRow[];
};

const PLATFORMS = ["facebook", "instagram", "youtube", "tiktok", "linkedin", "web", "generic"];
const LANGUAGES = ["en", "gr", "fr"];
const OBJECTIVES = ["awareness", "engagement", "traffic", "leads", "conversions", "sales"];
const TONES = ["professional", "warm", "playful", "urgent", "authoritative"];

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  AI_GENERATED: "bg-blue-50 text-blue-700 border-blue-200",
  VERIFICATION: "bg-purple-50 text-purple-700 border-purple-200",
  PENDING_APPROVAL: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  READY_TO_PUBLISH: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const TAB = [
  { id: "generate", label: "Generate", icon: Sparkles },
  { id: "copy", label: "Copy Builder", icon: FileText },
  { id: "library", label: "Media Library", icon: ImageIcon },
  { id: "campaigns", label: "Campaigns", icon: ShieldCheck },
] as const;

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
  return (
    <Badge className={STATUS_STYLE[status] || STATUS_STYLE.DRAFT}>{status.replace(/_/g, " ")}</Badge>
  );
}

export default function CreativeStudioPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [tab, setTab] = useState<(typeof TAB)[number]["id"]>("generate");

  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(false);

  // Generate form
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(1);
  const [language, setLanguage] = useState("en");
  const [objective, setObjective] = useState("leads");
  const [tone, setTone] = useState("warm");
  const [service, setService] = useState("");
  const [audience, setAudience] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [refData, setRefData] = useState<string>("");
  const [refMime, setRefMime] = useState("image/png");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  // Copy builder
  const [copyAssetId, setCopyAssetId] = useState("");
  const [copyPlatforms, setCopyPlatforms] = useState<string[]>(["facebook", "instagram"]);
  const [copyLanguages, setCopyLanguages] = useState<string[]>(["en", "gr"]);
  const [copying, setCopying] = useState(false);
  const [lastVariants, setLastVariants] = useState<VariantRow[]>([]);

  // Verify / approve
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");

  // Library filters
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterQ, setFilterQ] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(false);

  const api = useCallback(
    async (path: string, opts: RequestInit = {}) => {
      const headers: Record<string, string> = {
        ...(opts.headers as Record<string, string>),
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (opts.body) headers["Content-Type"] = "application/json";
      const res = await fetch(path, { ...opts, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      return data;
    },
    [token]
  );

  const loadCampaigns = useCallback(async () => {
    if (!token) return;
    setCampaignLoading(true);
    try {
      const d = await api("/api/creative/campaigns");
      setCampaigns(d.campaigns || []);
    } catch (e) {
      setNotice(`Campaigns: ${e instanceof Error ? e.message : "load failed"}`);
    } finally {
      setCampaignLoading(false);
    }
  }, [api, token]);

  const loadAssets = useCallback(async () => {
    if (!token) return;
    setLibraryLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      if (filterQ.trim()) params.set("q", filterQ.trim());
      const d = await api(`/api/creative/media?${params.toString()}`);
      setAssets(d.assets || []);
    } catch (e) {
      setNotice(`Library: ${e instanceof Error ? e.message : "load failed"}`);
    } finally {
      setLibraryLoading(false);
    }
  }, [api, token, filterType, filterStatus, filterQ]);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
    if (t) {
      setToken(t);
      setCampaigns([]);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadCampaigns();
    loadAssets();
  }, [token, loadCampaigns, loadAssets]);

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
        setToken(data.token);
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch {
      setLoginError("Connection error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_token");
    setToken(null);
    setAssets([]);
    setCampaigns([]);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const [header, b64] = result.split(",");
      if (header && b64) {
        setRefMime(file.type || "image/png");
        setRefData(b64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenerateError("");
    setNotice("");
    try {
      const d = await api("/api/creative/image", {
        method: "POST",
        body: JSON.stringify({
          prompt: prompt.trim(),
          count,
          language,
          objective,
          tone,
          service: service || undefined,
          audience: audience || undefined,
          campaignId: campaignId || undefined,
          campaignName: newCampaignName.trim() || undefined,
          referenceImage: refData ? { dataBase64: refData, mimeType: refMime } : undefined,
        }),
      });
      setNotice(
        `Generated ${d.assets?.length || 0} image(s) with ${d.model || "image model"}.`
      );
      setPrompt("");
      setRefData("");
      loadCampaigns();
      loadAssets();
      setTab("library");
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const openCopyFor = (assetId: string) => {
    setCopyAssetId(assetId);
    setLastVariants([]);
    setTab("copy");
  };

  const handleCopy = async () => {
    if (!copyAssetId) return;
    setCopying(true);
    setNotice("");
    try {
      const d = await api("/api/creative/copy", {
        method: "POST",
        body: JSON.stringify({
          assetId: copyAssetId,
          platforms: copyPlatforms,
          languages: copyLanguages,
        }),
      });
      setLastVariants(d.variants || []);
      setBusyId("");
      loadAssets();
    } catch (e) {
      setNotice(`Copy: ${e instanceof Error ? e.message : "generation failed"}`);
    } finally {
      setCopying(false);
    }
  };

  const handleVerify = async (assetId: string) => {
    setBusyId(assetId);
    setNotice("");
    try {
      const d = await api("/api/creative/verify", {
        method: "POST",
        body: JSON.stringify({ assetId }),
      });
      const checks = d.result?.brand_checks || [];
      const pii = d.result?.deterministic_pii;
      setNotice(
        `Verified: ${checks.filter((c: any) => c.passed).length}/${checks.length} brand checks passed. ` +
          `${pii?.found ? "PII DETECTED — review required." : "No PII detected."} ` +
          `Status moved to ${d.asset?.status || "PENDING_APPROVAL"}.`
      );
      loadAssets();
    } catch (e) {
      setNotice(`Verify: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setBusyId("");
    }
  };

  const handleApprove = async (assetId: string, action: "approve" | "reject") => {
    setBusyId(assetId);
    setNotice("");
    try {
      await api("/api/creative/approve", {
        method: "POST",
        body: JSON.stringify({ assetId, action }),
      });
      setNotice(action === "approve" ? "Asset APPROVED (not auto-published)." : "Asset REJECTED.");
      loadAssets();
    } catch (e) {
      setNotice(`Approval: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setBusyId("");
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    if (!name) return;
    try {
      await api("/api/creative/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name,
          service: (form.elements.namedItem("service") as HTMLInputElement).value || undefined,
          audience: (form.elements.namedItem("audience") as HTMLInputElement).value || undefined,
          objective: (form.elements.namedItem("objective") as HTMLSelectElement).value || undefined,
          tone: (form.elements.namedItem("tone") as HTMLSelectElement).value || undefined,
          language: (form.elements.namedItem("language") as HTMLSelectElement).value || undefined,
        }),
      });
      loadCampaigns();
      form.reset();
      setNotice("Campaign created.");
    } catch (e) {
      setNotice(`Campaign: ${e instanceof Error ? e.message : "create failed"}`);
    }
  };

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/25">
                <Sparkles className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Creative Studio</h1>
              <p className="text-sm text-slate-500 mt-1">
                AI image + ad copy generation, review, and approval
              </p>
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
              {loginError && <p className="text-sm text-red-600">{loginError}</p>}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-all disabled:opacity-60"
              >
                {loginLoading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white" size={16} />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Creative Studio</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {TAB.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-400">Publishing disabled until platform connections are verified</span>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start justify-between gap-3">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

        {tab === "generate" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-semibold text-slate-900">AI Image Generator</h2>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Concept / prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  placeholder="e.g. A modern Greek family on a sunny rooftop with new photovoltaic panels, smiling, clear sky; energy savings theme"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Variations</label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Objective</label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {OBJECTIVES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {TONES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Service</label>
                  <input
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="energy / insurance / web"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Audience</label>
                  <input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. homeowners, 35-55"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Campaign</label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="">{campaignLoading ? "Loading…" : "-- none --"}</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    or new campaign name
                  </label>
                  <input
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    placeholder="e.g. PV Spring 2026"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Optional reference image
                </label>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:border-brand-400 transition-colors">
                  <Upload size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-500">
                    {refData ? "Reference image selected" : "Upload brand/product reference"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                </label>
                {refData && (
                  <img
                    src={`data:${refMime};base64,${refData}`}
                    alt="Reference"
                    className="mt-2 h-24 w-24 object-cover rounded-xl border border-slate-200"
                  />
                )}
              </div>
              {generateError && <p className="text-sm text-red-600">{generateError}</p>}
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {generating ? "Generating…" : `Generate ${count} image${count > 1 ? "s" : ""}`}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-semibold text-slate-900">Latest generated assets</h2>
              <div className="grid gap-3">
                {assets.length === 0 && (
                  <p className="text-sm text-slate-400">No assets yet. Generate your first image.</p>
                )}
                {assets.map((a) => (
                  <div key={a.id} className="flex gap-3 items-start border border-slate-100 rounded-xl p-3">
                    {a.asset_path && (
                      <img src={a.asset_path} alt={a.title} className="h-20 w-20 object-cover rounded-lg" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{a.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <StatusBadge status={a.status} />
                        {a.model && <span className="text-xs text-slate-400">{a.model}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {a.status === "AI_GENERATED" && (
                          <>
                            <button
                              onClick={() => handleVerify(a.id)}
                              disabled={busyId === a.id}
                              className="px-2 py-1 text-xs bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 inline-flex items-center gap-1"
                            >
                              {busyId === a.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                              Verify &amp; approve
                            </button>
                            <button
                              onClick={() => openCopyFor(a.id)}
                              className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 inline-flex items-center gap-1"
                            >
                              <Copy size={12} /> Ad copy
                            </button>
                          </>
                        )}
                        {(a.status === "PENDING_APPROVAL" || a.status === "VERIFICATION") && (
                          <>
                            <button
                              onClick={() => handleApprove(a.id, "approve")}
                              disabled={busyId === a.id}
                              className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 inline-flex items-center gap-1"
                            >
                              <Check size={12} /> {a.status === "VERIFICATION" ? "Approve" : "Approve"}
                            </button>
                            <button
                              onClick={() => handleApprove(a.id, "reject")}
                              disabled={busyId === a.id}
                              className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 inline-flex items-center gap-1"
                            >
                              <X size={12} /> Reject
                            </button>
                          </>
                        )}
                        {a.status === "APPROVED" && (
                          <span className="text-xs text-slate-400">
                            Approved — keep for future publishing (disabled today).
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "copy" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-semibold text-slate-900">Ad Copy Generator</h2>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Image asset</label>
                <select
                  value={copyAssetId}
                  onChange={(e) => setCopyAssetId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">-- select generated image --</option>
                  {assets
                    .filter((a) => a.asset_type === "image")
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title.slice(0, 70)}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Platforms</label>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => toggle(copyPlatforms, p, setCopyPlatforms)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        copyPlatforms.includes(p)
                          ? "bg-brand-50 border-brand-300 text-brand-700"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Languages</label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      onClick={() => toggle(copyLanguages, l, setCopyLanguages)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        copyLanguages.includes(l)
                          ? "bg-brand-50 border-brand-300 text-brand-700"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCopy}
                disabled={copying || !copyAssetId}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {copying ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                {copying ? "Generating copy…" : "Generate ad copy"}
              </button>
              <p className="text-xs text-slate-400">
                Copy follows your active brand + compliance guards. Regenerating replaces the
                platform/language variants for this asset.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold text-slate-900">Variants</h2>
              {lastVariants.length === 0 && (
                <p className="text-sm text-slate-400">Select an image asset and generate copy.</p>
              )}
              {lastVariants.map((v) => (
                <div key={`${v.platform}-${v.language}`} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                      {v.platform} / {v.language.toUpperCase()}
                    </Badge>
                    <StateBadgeMini s={v.status} />
                  </div>
                  {v.headline && <p className="text-sm font-semibold text-slate-900">{v.headline}</p>}
                  {v.primary_text && <p className="text-sm text-slate-700">{v.primary_text}</p>}
                  {v.short_text && <p className="text-sm text-slate-500">{v.short_text}</p>}
                  {v.cta && <p className="text-xs text-brand-700 font-medium">CTA: {v.cta}</p>}
                  {v.hashtags?.length ? (
                    <p className="text-xs text-slate-400">{v.hashtags.join(" ")}</p>
                  ) : null}
                  {v.alt_text && <p className="text-xs text-slate-400">alt: {v.alt_text}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "library" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-end gap-3">
              <input
                value={filterQ}
                onChange={(e) => setFilterQ(e.target.value)}
                placeholder="Search…"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm min-w-[180px]"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All types</option>
                <option value="image">Image</option>
                <option value="copy">Copy</option>
                <option value="creative_set">Creative set</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All statuses</option>
                {["DRAFT", "AI_GENERATED", "VERIFICATION", "PENDING_APPROVAL", "APPROVED", "READY_TO_PUBLISH", "REJECTED"].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
              <button
                onClick={loadAssets}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm inline-flex items-center gap-1.5"
              >
                <RefreshCw size={14} className={libraryLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assets.length === 0 && (
                <p className="text-sm text-slate-400 col-span-full">No assets match.</p>
              )}
              {assets.map((a) => (
                <div key={a.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  {a.asset_path ? (
                    <img src={a.asset_path} alt={a.title} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="h-44 bg-slate-100 flex items-center justify-center text-slate-300">
                      <FileText size={32} />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{a.title}</p>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs text-slate-400">
                      {a.kind}
                      {a.language ? ` · ${a.language.toUpperCase()}` : ""}
                      {a.platforms?.length ? ` · ${a.platforms.join(", ")}` : ""}
                      {a.variants?.length ? ` · ${a.variants.length} variant(s)` : ""}
                    </div>
                    {a.checks?.summary && (
                      <p className="text-xs text-slate-500 line-clamp-2">{a.checks.summary}</p>
                    )}
                    {a.checks?.deterministic_pii?.found && (
                      <Badge className="bg-red-50 text-red-700 border-red-200">
                        PII: {a.checks.deterministic_pii.matches.join(", ").slice(0, 60)}
                      </Badge>
                    )}
                    {a.checks?.compliance?.needs_human_review && (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                        Regulated claim — human review
                      </Badge>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {a.status === "AI_GENERATED" && (
                        <>
                          <button
                            onClick={() => handleVerify(a.id)}
                            disabled={busyId === a.id}
                            className="px-2 py-1 text-xs bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 inline-flex items-center gap-1"
                          >
                            {busyId === a.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                            Verify
                          </button>
                          <button
                            onClick={() => openCopyFor(a.id)}
                            className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 inline-flex items-center gap-1"
                          >
                            <Copy size={12} /> Copy
                          </button>
                        </>
                      )}
                      {(a.status === "PENDING_APPROVAL" || a.status === "VERIFICATION") && (
                        <>
                          <button
                            onClick={() => handleApprove(a.id, "approve")}
                            disabled={busyId === a.id}
                            className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 inline-flex items-center gap-1"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleApprove(a.id, "reject")}
                            disabled={busyId === a.id}
                            className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 inline-flex items-center gap-1"
                          >
                            <X size={12} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                    {a.variants && a.variants.length > 0 && (
                      <details className="pt-1">
                        <summary className="text-xs text-slate-500 cursor-pointer">
                          View {a.variants.length} copy variant(s)
                        </summary>
                        <div className="mt-2 space-y-2">
                          {a.variants.map((v) => (
                            <div key={v.id} className="border border-slate-100 rounded-lg p-2 text-xs space-y-0.5">
                              <span className="font-medium text-slate-700">
                                {v.platform} / {v.language.toUpperCase()}
                              </span>
                              {v.headline && <p className="text-slate-600 font-medium">{v.headline}</p>}
                              {v.primary_text && <p className="text-slate-600">{v.primary_text}</p>}
                              {v.cta && <p className="text-brand-700">CTA: {v.cta}</p>}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "campaigns" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">New campaign</h2>
              <form onSubmit={handleCreateCampaign} className="space-y-3">
                <input
                  name="name"
                  placeholder="Campaign name *"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
                <input
                  name="service"
                  placeholder="Service (energy / insurance / web)"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
                <input
                  name="audience"
                  placeholder="Audience"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    name="objective"
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {OBJECTIVES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <select
                    name="tone"
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    name="language"
                    defaultValue="en"
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-all"
                >
                  Create campaign
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h2 className="font-semibold text-slate-900">Campaigns</h2>
              {campaigns.length === 0 && <p className="text-sm text-slate-400">No campaigns yet.</p>}
              {campaigns.map((c) => (
                <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {[c.service, c.audience, c.objective, c.tone, c.language?.toUpperCase()]
                        .filter(Boolean)
                        .join(" · ") || "no details"}
                    </p>
                  </div>
                  <Badge className="bg-slate-100 text-slate-600 border-slate-200">{c.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StateBadgeMini({ s }: { s: string }) {
  return <Badge className={STATUS_STYLE[s] || STATUS_STYLE.DRAFT}>{s.replace(/_/g, " ")}</Badge>;
}