"use client";

import { Fragment, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  NAV_GROUPS,
  resolveCrmTab,
  plannedModuleByKey,
  type NavItem,
} from "./nav";
import { useAdminAuth } from "./AdminAuthProvider";
import {
  AtlasThemeProvider,
  useAtlasTheme,
  type AtlasFinish,
} from "./atlasTheme";

type Crumb = { label: string; href?: string };

type AdminShellProps = {
  breadcrumbs: Crumb[];
  headerRight?: React.ReactNode;
  children: React.ReactNode;
};

// Finish switch — the "widget that changes finish 1 or 2" (2a warm paper / 2b night console).
function FinishSwitch() {
  const { finish, setFinish } = useAtlasTheme();
  const options: { key: AtlasFinish; label: string; title: string }[] = [
    { key: "warm", label: "☀ Paper", title: "2a — warm paper workspace" },
    { key: "night", label: "🌙 Console", title: "2b — night console" },
  ];
  return (
    <div
      className="flex rounded-lg p-0.5 gap-0.5"
      style={{ background: "var(--cc-chip)" }}
      role="radiogroup"
      aria-label="Command Center finish"
    >
      {options.map((o) => (
        <button
          key={o.key}
          title={o.title}
          role="radio"
          aria-checked={finish === o.key}
          onClick={() => setFinish(o.key)}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
            finish === o.key ? "bg-[var(--cc-card)] text-[var(--cc-ink)] shadow-sm" : "text-[var(--cc-glass-ink-dim)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function navCounts(): { live: number; beta: number; planned: number } {
  let live = 0;
  let beta = 0;
  let planned = 0;
  for (const g of NAV_GROUPS) {
    for (const it of g.items) {
      if (it.state === "live") live++;
      else if (it.state === "beta") beta++;
      else planned++;
    }
  }
  return { live, beta, planned };
}

// Maturity dot — the honest module state (1c). Live/Beta are filled; Planned is a hollow ring.
function MaturityDot({ state, active }: { state: NavItem["state"]; active?: boolean }) {
  if (state === "live") {
    return (
      <span
        className="w-[7px] h-[7px] rounded-full flex-none"
        style={{ background: "var(--cc-live)", boxShadow: "0 0 0 3px var(--cc-live-glow)" }}
      />
    );
  }
  if (state === "beta") {
    return <span className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: "var(--cc-beta)" }} />;
  }
  // planned — hollow ring, honest: nothing behind it yet
  return (
    <span
      className="w-[7px] h-[7px] rounded-full flex-none"
      style={{
        border: `1px solid ${active ? "var(--cc-glass-ink-dim)" : "var(--cc-planned)"}`,
      }}
    />
  );
}

function SidebarItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={item.description}
      className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] transition-colors px-2.5 h-8 ${
        active
          ? "font-semibold"
          : item.state === "planned"
          ? "text-[var(--cc-glass-ink-dim)]"
          : "text-[var(--cc-glass-ink)]"
      }`}
      style={active ? { background: "var(--cc-glass-active)" } : active ? { background: "var(--cc-glass-active)" } : undefined}
    >
      <MaturityDot state={item.state} active={active} />
      <span className="flex-1 truncate text-left">{item.label}</span>
      {item.state === "beta" && (
        <span
          className="atlas-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider"
          style={{ background: "var(--cc-indigo-bg)", color: "var(--cc-indigo-ink)" }}
        >
          beta
        </span>
      )}
    </button>
  );
}

function Legend() {
  const [open, setOpen] = useState(false);
  const rows: { label: string; node: React.ReactNode }[] = [
    { label: "Live — real data, safe to use", node: <MaturityDot state="live" /> },
    { label: "Beta — works, still changing", node: <MaturityDot state="beta" /> },
    { label: "Planned — nothing behind it yet", node: <MaturityDot state="planned" /> },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] font-medium hover:underline"
        style={{ color: "var(--cc-indigo-ink)" }}
      >
        Legend
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-full mb-2 right-0 z-40 w-56 rounded-xl p-3 space-y-2"
            style={{ background: "var(--cc-card-2)", border: "1px solid var(--cc-line-2)", boxShadow: "0 10px 30px -10px var(--cc-shadow)" }}
          >
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-2.5 text-[12px]" style={{ color: "var(--cc-glass-ink)" }}>
                {r.node}
                <span>{r.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AdminShellInner({ breadcrumbs, headerRight, children }: AdminShellProps) {
  const { token, mounted, login, logout } = useAdminAuth();
  const { finish } = useAtlasTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hidePlanned, setHidePlanned] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("atlas_nav_collapsed");
        return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      } catch {
        /* ignore */
      }
    }
    return {};
  });

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("atlas_nav_collapsed", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const rawTab = searchParams.get("tab");
  const moduleKey = searchParams.get("module");
  const tab = resolveCrmTab(rawTab, moduleKey);

  const onItemClick = (item: NavItem) => {
    setSidebarOpen(false);
    if (item.href) {
      router.push(item.href);
      return;
    }
    if (item.state === "planned") {
      router.push(`/admin/crm?tab=planned&module=${item.key}`);
      return;
    }
    if (item.tab) {
      const target = `/admin/crm?tab=${item.tab}`;
      if (pathname === "/admin/crm") router.replace(target);
      else router.push(target);
    }
  };

  const isActive = (item: NavItem): boolean => {
    if (item.href) return pathname === item.href;
    if (item.state === "planned") {
      return pathname === "/admin/crm" && rawTab === "planned" && moduleKey === item.key;
    }
    if (item.tab) return pathname === "/admin/crm" && tab === item.tab;
    return false;
  };

  if (!mounted) {
    return (
      <main className="min-h-screen atlas-canvas flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--cc-indigo)] border-t-transparent rounded-full" />
      </main>
    );
  }

  if (!token) {
    return <LoginScreen onLogin={login} />;
  }

  const counts = navCounts();
  const activeItem = (() => {
    for (const g of NAV_GROUPS) for (const it of g.items) if (isActive(it)) return it;
    return null;
  })();

  return (
    <main
      data-atlas-theme={finish}
      className="min-h-screen atlas-canvas flex"
    >
      {/* Sidebar — liquid glass, theme-aware */}
      <aside
        className={`crm-glass-sidebar w-64 flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:sticky md:top-0`}
      >
        <div className="px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-none"
              style={{ background: "var(--cc-card)", border: "1px solid var(--cc-glass-border)", boxShadow: "0 1px 2px var(--cc-shadow-soft)" }}
            >
              <span className="atlas-plex text-sm font-bold" style={{ color: "var(--cc-indigo-ink)" }}>
                A
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="atlas-plex text-[14px] font-semibold leading-tight truncate" style={{ color: "var(--cc-glass-ink)" }}>
                Atlas
              </h1>
              <p className="text-[10px] truncate leading-tight" style={{ color: "var(--cc-glass-ink-dim)" }}>
                Agapitos Kalafatas
              </p>
            </div>
          </div>

          {/* Search pill — global search is a later foundation; the affordance stays honest */}
          <div className="mt-4 flex items-center gap-2 h-9 px-3 rounded-lg" style={{ background: "var(--cc-chip)", color: "var(--cc-glass-ink-dim)" }}>
            <span className="opacity-70 text-[13px]">⌕</span>
            <span className="flex-1 text-[12.5px]">Search</span>
            <span className="atlas-mono text-[9.5px] px-1.5 py-0.5 rounded" style={{ background: "var(--cc-card)", color: "var(--cc-glass-ink-dim)" }}>
              ⌘K
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 pb-2 space-y-1 overflow-y-auto">
          {NAV_GROUPS.map((group) => {
            const collapsed = collapsedGroups[group.id] ?? false;
            const items = group.items.filter((it) => !(hidePlanned && it.state === "planned"));
            if (items.length === 0) return null;
            const plannedHidden = hidePlanned ? 0 : group.items.filter((it) => it.state === "planned").length;
            return (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg group-hover:bg-white/5"
                  style={{ color: "var(--cc-glass-ink-dim)" }}
                >
                  <span className="atlas-mono text-[9.5px] font-semibold uppercase tracking-[0.1em]">{group.label}</span>
                  <span className="text-[9px]">{collapsed ? "▸" : "▾"}</span>
                </button>
                {collapsed ? (
                  <div className="px-2 pb-0.5 atlas-mono text-[10px]" style={{ color: "var(--cc-glass-ink-dim)" }}>
                    {items.filter((i) => i.state === "live" || i.state === "beta").length > 0
                      ? `${items.filter((i) => i.state === "live" || i.state === "beta").length} live`
                      : ""}
                    {plannedHidden > 0 && <span>{items.filter((i) => i.state === "live" || i.state === "beta").length > 0 ? " · " : ""}+{plannedHidden} planned</span>}
                  </div>
                ) : (
                  <div className="space-y-0.5 mt-0.5">
                    {items.map((item) => (
                      <SidebarItem key={item.key} item={item} active={isActive(item)} onClick={() => onItemClick(item)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-4 py-3 space-y-3" style={{ borderTop: "1px solid var(--cc-glass-border)" }}>
          <div className="flex items-center gap-2">
            <MaturityDot state="live" />
            <span className="atlas-mono text-[11px]" style={{ color: "var(--cc-glass-ink)" }}>
              {counts.live + counts.beta} live · {counts.planned} planned
            </span>
            <div className="flex-1" />
            <Legend />
          </div>

          <label className="flex items-center gap-2 text-[11.5px] cursor-pointer select-none" style={{ color: "var(--cc-glass-ink-dim)" }}>
            <input
              type="checkbox"
              checked={hidePlanned}
              onChange={(e) => setHidePlanned(e.target.checked)}
              className="accent-[var(--cc-indigo)]"
            />
            Hide planned modules
          </label>

          <FinishSwitch />
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12.5px] transition-colors"
            style={{ color: "var(--cc-glass-ink-dim)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cc-chip)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Breadcrumb header */}
        <header
          className="sticky top-0 z-20 backdrop-blur-xl"
          style={{
            background: "color-mix(in srgb, var(--cc-bg) 78%, transparent)",
            borderBottom: "1px solid var(--cc-line-2)",
          }}
        >
          <div className="flex items-center gap-2 px-4 md:px-8 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg hover:bg-white/10"
              style={{ color: "var(--cc-glass-ink)" }}
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <Fragment key={i}>
                  {i > 0 && (
                    <span className="shrink-0" style={{ color: "var(--cc-faint)" }}>
                      {activeItem ? "›" : "/"}
                    </span>
                  )}
                  {crumb.href ? (
                    <a href={crumb.href} className="font-medium hover:underline" style={{ color: "var(--cc-indigo-ink)" }}>
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="font-semibold" style={{ color: "var(--cc-ink)" }}>
                      {crumb.label}
                    </span>
                  )}
                </Fragment>
              ))}
            </nav>
            {headerRight && <div className="ml-auto shrink-0">{headerRight}</div>}
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 min-w-0">{children}</div>
      </div>
    </main>
  );
}

export default function AdminShell(props: AdminShellProps) {
  return (
    <AtlasThemeProvider>
      <AdminShellInner {...props} />
    </AtlasThemeProvider>
  );
}

function LoginScreen({ onLogin }: { onLogin: (u: string, p: string) => Promise<string | null> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const err = await onLogin(username, password);
    if (err) setError(err);
    setBusy(false);
  };

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
        <form onSubmit={submit} className="crm-card-3d rounded-3xl p-8 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Username</label>
            <input
              type="text"
              required
              autoComplete="username"
              className="w-full p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-900"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="w-full p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}