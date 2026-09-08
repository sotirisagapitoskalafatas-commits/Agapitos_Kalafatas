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

type Crumb = { label: string; href?: string };

type AdminShellProps = {
  breadcrumbs: Crumb[];
  headerRight?: React.ReactNode;
  children: React.ReactNode;
};

export default function AdminShell({ breadcrumbs, headerRight, children }: AdminShellProps) {
  const { token, mounted, login, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <main className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </main>
    );
  }

  if (!token) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 flex">
      {/* Sidebar */}
      <aside
        className={`crm-glass-sidebar w-64 flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:sticky md:top-0`}
      >
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
                      const active = isActive(item);
                      if (item.state === "planned") {
                        return (
                          <button
                            key={item.key}
                            title={item.description}
                            onClick={() => onItemClick(item)}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              active
                                ? "bg-white/15 text-white"
                                : "text-slate-300/60 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span className="text-xs text-slate-400">◌</span>
                            {item.label}
                            <span className="ml-auto text-[9px] uppercase tracking-wide bg-white/10 text-slate-300/60 rounded px-1.5 py-0.5">
                              planned
                            </span>
                          </button>
                        );
                      }
                      return (
                        <button
                          key={item.key}
                          title={item.description}
                          onClick={() => onItemClick(item)}
                          className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            active
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
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-200/70 hover:text-red-300 hover:bg-white/10 transition-all"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Column */}
      <div className="flex-1 md:ml-64 ml-0 min-w-0 flex flex-col">
        {/* Breadcrumb header */}
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-slate-200/70">
          <div className="flex items-center gap-2 px-4 md:px-8 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className="text-slate-400 shrink-0">/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="text-indigo-600 hover:text-indigo-700 font-medium">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-slate-700 font-semibold">{crumb.label}</span>
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