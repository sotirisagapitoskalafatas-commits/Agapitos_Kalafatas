"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Info,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  NAV_GROUPS,
  groupByItemKey,
  resolveCrmTab,
  type NavGroup,
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

// ── Shell language (persisted per browser; UI chrome only — no business logic) ──
type ShellLang = "el" | "en" | "fr";
const LANG_STORAGE = "atlas_lang";
const LANGS: { key: ShellLang; label: string }[] = [
  { key: "el", label: "GR" },
  { key: "en", label: "EN" },
  { key: "fr", label: "FR" },
];
function langLocale(l: ShellLang): string {
  return l === "el" ? "el-GR" : l === "fr" ? "fr-FR" : "en-GB";
}

type TKey =
  | "greetingMorning"
  | "greetingAfternoon"
  | "greetingEvening"
  | "search"
  | "hidePlanned"
  | "legend"
  | "logout"
  | "openMenu"
  | "close"
  | "collapseRail"
  | "expandRail";

const T: Record<ShellLang, Record<TKey, string>> = {
  el: {
    greetingMorning: "Καλημέρα",
    greetingAfternoon: "Καλησπέρα",
    greetingEvening: "Καλησπέρα",
    search: "Αναζήτηση πελατών, leads, εγγράφων…",
    hidePlanned: "Απόκρυψη προγραμματισμένων μονάδων",
    legend: "Υπόμνημα",
    logout: "Αποσύνδεση",
    openMenu: "Άνοιγμα μενού",
    close: "Κλείσιμο",
    collapseRail: "Σύμπτυξη πλαϊνού",
    expandRail: "Επέκταση πλαϊνού",
  },
  en: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    search: "Search customers, leads, documents…",
    hidePlanned: "Hide planned modules",
    legend: "Legend",
    logout: "Logout",
    openMenu: "Open menu",
    close: "Close",
    collapseRail: "Collapse sidebar",
    expandRail: "Expand sidebar",
  },
  fr: {
    greetingMorning: "Bonjour",
    greetingAfternoon: "Bon après-midi",
    greetingEvening: "Bonsoir",
    search: "Rechercher clients, leads, documents…",
    hidePlanned: "Masquer les modules planifiés",
    legend: "Légende",
    logout: "Déconnexion",
    openMenu: "Ouvrir le menu",
    close: "Fermer",
    collapseRail: "Réduire la barre latérale",
    expandRail: "Étendre la barre latérale",
  },
};

function greetingKey(h: number): TKey {
  if (h < 12) return "greetingMorning";
  if (h < 18) return "greetingAfternoon";
  return "greetingEvening";
}

function useShellLang(): { lang: ShellLang; setLang: (l: ShellLang) => void; t: Record<TKey, string>; locale: string } {
  const [lang, setLangState] = useState<ShellLang>("el");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LANG_STORAGE);
      if (raw === "el" || raw === "en" || raw === "fr") setLangState(raw);
    } catch {
      /* ignore */
    }
  }, []);
  const setLang = useCallback((l: ShellLang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_STORAGE, l);
    } catch {
      /* ignore */
    }
  }, []);
  return { lang, setLang, t: T[lang], locale: langLocale(lang) };
}

// ── Real shell status: JARVIS pills + attention + notification badge ──────────
// All numbers come from /api/crm/command + /api/crm/notifications. If the fetch
// fails, the bar renders without counts — nothing is invented.
type ShellStatus = {
  jarvis?: {
    counts: { running: number; awaitingApproval: number; failures: number };
    note?: string;
  };
  attentionTotal?: number;
  notificationCount?: number;
};

function useShellStatus(token: string | null): ShellStatus | null {
  const [status, setStatus] = useState<ShellStatus | null>(null);
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/crm/command", { headers }).then((r) => r.json().catch(() => null)),
      fetch("/api/crm/notifications", { headers }).then((r) => r.json().catch(() => null)),
    ])
      .then(([cmd, notif]) => {
        if (cancelled) return;
        const list = Array.isArray(notif) ? notif : Array.isArray(notif?.data) ? notif.data : null;
        setStatus({
          jarvis: cmd?.jarvis ?? undefined,
          attentionTotal: typeof cmd?.attention?.total === "number" ? cmd.attention.total : undefined,
          notificationCount: list ? list.filter((n: any) => n?.status === "pending").length : undefined,
        });
      })
      .catch(() => {
        if (!cancelled) setStatus({});
      });
    return () => {
      cancelled = true;
    };
  }, [token]);
  return status;
}

// ── Finish switch (2a warm paper / 2b night console), icon-labeled ──────────
function FinishSwitch({ collapsed }: { collapsed?: boolean }) {
  const { finish, setFinish, toggle } = useAtlasTheme();
  if (collapsed) {
    return (
      <button
        onClick={toggle}
        title={finish === "warm" ? "Paper · Console" : "Console · Paper"}
        aria-label="Toggle finish"
        className="atlas-rail-tile"
      >
        {finish === "warm" ? <Sun className="w-[17px] h-[17px]" /> : <Moon className="w-[17px] h-[17px]" />}
      </button>
    );
  }
  const options: { key: AtlasFinish; label: string; icon: LucideIcon }[] = [
    { key: "warm", label: "Paper", icon: Sun },
    { key: "night", label: "Console", icon: Moon },
  ];
  return (
    <div
      className="flex rounded-lg p-0.5 gap-0.5"
      style={{ background: "var(--cc-chip)" }}
      role="radiogroup"
      aria-label="Command Center finish"
    >
      {options.map((o) => {
        const Icon = o.icon;
        const active = finish === o.key;
        return (
          <button
            key={o.key}
            role="radio"
            aria-checked={active}
            onClick={() => setFinish(o.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
              active ? "bg-[var(--cc-card)] text-[var(--cc-ink)] shadow-sm" : "text-[var(--cc-glass-ink-dim)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Honest module state indicators (1c) ──
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
  return (
    <span
      className="w-[7px] h-[7px] rounded-full flex-none"
      style={{ border: `1px solid ${active ? "var(--cc-glass-ink-dim)" : "var(--cc-planned)"}` }}
    />
  );
}

function BetaBadge() {
  return (
    <span
      className="atlas-mono text-[8.5px] font-semibold px-1 py-[1px] rounded uppercase tracking-wider flex-none"
      style={{ border: "1px solid var(--cc-beta)", color: "var(--cc-beta)" }}
    >
      beta
    </span>
  );
}

function ItemStatus({ item, count }: { item: NavItem; count?: number }) {
  if (item.state === "live") {
    if (count !== undefined) {
      return <span className="atlas-nav-meta flex-none">{count}</span>;
    }
    return <MaturityDot state="live" />;
  }
  if (item.state === "beta") return <BetaBadge />;
  if (item.state === "planned") return <MaturityDot state="planned" />;
  return null;
}

// ── Legend popover ──
function Legend({ t }: { t: Record<TKey, string> }) {
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
        aria-expanded={open}
        className="flex items-center gap-1 text-[11px] font-medium hover:underline"
        style={{ color: "var(--cc-indigo-ink)" }}
      >
        <Info className="w-3.5 h-3.5" />
        <span className={open ? "" : "hidden"}>{t.legend}</span>
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

// ── JARVIS status bar (real counts only — no simulate/pause without a backend) ──
function JarvisStatusBar({ status }: { status: ShellStatus | null }) {
  const counts = status?.jarvis?.counts;
  if (!counts) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold atlas-plex" style={{ color: "var(--cc-glass-ink)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--cc-live)", boxShadow: "0 0 0 3px var(--cc-live-glow)" }} />
          JARVIS
        </span>
      </div>
    );
  }
  const pill = (label: string, value: number, color: string, strong?: boolean) => (
    <span
      className="atlas-mono text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1.5"
      style={{
        background: strong ? "var(--cc-chip)" : "transparent",
        color: value > 0 ? color : "var(--cc-glass-ink-dim)",
        border: "1px solid var(--cc-glass-border)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: value > 0 ? color : "var(--cc-planned)" }}
      />
      {value} {label}
    </span>
  );
  return (
    <div
      className="flex items-center gap-1.5 flex-wrap"
      title={status?.jarvis?.note ?? undefined}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold atlas-plex" style={{ color: "var(--cc-glass-ink)" }}>
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--cc-live)", boxShadow: "0 0 0 3px var(--cc-live-glow)" }} />
        JARVIS <span className="text-[9px] font-bold tracking-[0.12em] atlas-mono" style={{ color: "var(--cc-glass-ink-dim)" }}>SUPERVISED</span>
      </span>
      {pill("running", counts.running, "var(--cc-live)")}
      {pill("awaiting approval", counts.awaitingApproval, "var(--cc-amber-bright)", true)}
      {pill("failure" + (counts.failures === 1 ? "" : "s"), counts.failures, "var(--cc-red)")}
    </div>
  );
}

function ShellTopBar({ breadcrumbs, headerRight, lang, setLang, t, status, onOpenMenu, onChangeLang }: {
  breadcrumbs: Crumb[];
  headerRight?: React.ReactNode;
  lang: ShellLang;
  setLang: (l: ShellLang) => void;
  t: Record<TKey, string>;
  status: ShellStatus | null;
  onOpenMenu: () => void;
  onChangeLang: (l: ShellLang) => void;
}) {
  const router = useRouter();
  const now = new Date();
  const dateLine = new Intl.DateTimeFormat(langLocale(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <div className="sticky top-0 z-20 atlas-topbar backdrop-blur-xl" style={{ background: "color-mix(in srgb, var(--cc-bg) 78%, transparent)" }}>
      {/* Row 2 — breadcrumb + global controls */}
      <div className="flex items-center gap-2 px-4 md:px-6 py-2">
        <button
          onClick={onOpenMenu}
          className="md:hidden p-2 -ml-1 rounded-lg hover:bg-white/10"
          style={{ color: "var(--cc-glass-ink)" }}
          aria-label={t.openMenu}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <nav className="flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--cc-faint)" }} />
              )}
              {crumb.href ? (
                <a href={crumb.href} className="font-medium hover:underline" style={{ color: "var(--cc-indigo-ink)" }}>
                  {crumb.label}
                </a>
              ) : (
                <span className="font-semibold truncate max-w-[180px] md:max-w-none" style={{ color: "var(--cc-ink)" }}>
                  {crumb.label}
                </span>
              )}
            </Fragment>
          ))}
        </nav>
        <div className="flex-1" />
        {headerRight && <div className="shrink-0">{headerRight}</div>}
        {/* Language */}
        <div className="flex items-center gap-0.5 shrink-0" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button
              key={l.key}
              onClick={() => onChangeLang(l.key)}
              aria-pressed={lang === l.key}
              className={`atlas-lang-btn ${lang === l.key ? "atlas-lang-btn-active" : ""}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        {/* Notifications — real pending count */}
        <button
          onClick={() => router.push("/admin/crm?tab=notifications")}
          className="relative p-2 rounded-lg hover:bg-white/10 shrink-0"
          style={{ color: "var(--cc-glass-ink)" }}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-[17px] h-[17px]" />
          {!!status?.notificationCount && status.notificationCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] atlas-mono font-semibold flex items-center justify-center"
              style={{ background: "var(--cc-red)", color: "#fff" }}
            >
              {status.notificationCount}
            </span>
          )}
        </button>
        {/* Profile */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 atlas-plex text-[11px] font-bold"
          style={{ background: "var(--cc-indigo-bg)", color: "var(--cc-indigo-ink)", border: "1px solid var(--cc-glass-border)" }}
          title="Agapitos Kalafatas"
        >
          AK
        </div>
      </div>

      {/* Row 2 — date + greeting | global search | JARVIS status */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 md:px-6 pb-2.5">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-tight atlas-plex" style={{ color: "var(--cc-ink)" }}>
            {dateLine}
          </div>
          <div className="text-[11.5px] leading-tight flex items-center gap-1.5" style={{ color: "var(--cc-glass-ink-dim)" }}>
            <span>{t[greetingKey(new Date().getHours())]}, Sotiris</span>
          </div>
        </div>
        <div className="flex-1 min-w-[180px]" />
        <button
          className="atlas-glass-pill flex items-center gap-2 px-3 h-9 flex-1 sm:flex-none sm:w-72 max-w-md"
          aria-label={t.search}
          title={t.search}
        >
          <Search className="w-4 h-4 flex-none opacity-70" />
          <span className="flex-1 text-left text-[12.5px] truncate">{t.search}</span>
          <span className="atlas-mono text-[9.5px] px-1.5 py-0.5 rounded flex-none" style={{ background: "var(--cc-card)", color: "var(--cc-glass-ink-dim)" }}>
            ⌘K
          </span>
        </button>
        <div className="flex-1" />
        <JarvisStatusBar status={status} />
      </div>
    </div>
  );
}

function SidebarItem({ item, active, count, onClick }: { item: NavItem; active: boolean; count?: number; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={item.description}
      className={`atlas-nav-item ${active ? "atlas-nav-item-active" : item.state === "planned" ? "atlas-nav-item-planned" : ""}`}
    >
      <Icon className="atlas-nav-icon" />
      <span className="flex-1 truncate text-left">{item.label}</span>
      <ItemStatus item={item} count={count} />
    </button>
  );
}

function AdminShellInner({ breadcrumbs, headerRight, children }: AdminShellProps) {
  const { token, mounted, login, logout } = useAdminAuth();
  const { finish, setFinish } = useAtlasTheme();
  const { lang, setLang, t } = useShellLang();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = useShellStatus(token);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hidePlanned, setHidePlanned] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [openGroupId, setOpenGroupIdState] = useState<string | null>(null);

  useEffect(() => {
    try {
      setRailCollapsed(localStorage.getItem("atlas_nav_rail") === "1");
      const stored = localStorage.getItem("atlas_nav_open");
      const valid = stored && NAV_GROUPS.some((g) => g.id === stored);
      if (valid) setOpenGroupIdState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setOpenGroup = useCallback((id: string | null) => {
    setOpenGroupIdState(id);
    try {
      if (id) localStorage.setItem("atlas_nav_open", id);
      else localStorage.removeItem("atlas_nav_open");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleRail = useCallback(() => {
    setRailCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("atlas_nav_rail", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

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

  const activeItemKey = useMemo(() => {
    for (const g of NAV_GROUPS) for (const it of g.items) if (isActive(it)) return it.key;
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, rawTab, moduleKey, tab]);

  // Auto-open the group that contains the active page.
  useEffect(() => {
    const g = activeItemKey ? groupByItemKey(activeItemKey) : null;
    if (g && g.id !== "command") setOpenGroup(g.id);
  }, [activeItemKey, setOpenGroup]);

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
  const pinnedGroupId = "command";
  const effCollapsed = railCollapsed && !sidebarOpen;

  const toggleGroup = (id: string) => {
    if (id === pinnedGroupId) return;
    setOpenGroup(openGroupId === id ? null : id);
  };

  const groupMeta = (g: NavGroup) => {
    const live = g.items.filter((i) => i.state === "live").length;
    const beta = g.items.filter((i) => i.state === "beta").length;
    const planned = hidePlanned ? 0 : g.items.filter((i) => i.state === "planned").length;
    const l = live + beta;
    const parts: string[] = [];
    if (l > 0) parts.push(`${l} live`);
    if (planned > 0) parts.push(`+${planned} planned`);
    return parts.join(" · ");
  };

  return (
    <main data-atlas-theme={finish} className="min-h-screen atlas-canvas flex">
      {/* Sidebar — liquid glass, theme-aware, widths: 240px / 60px rail */}
      <aside
        className={`crm-glass-sidebar w-64 flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ${effCollapsed ? "md:w-[60px]" : ""} ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:sticky md:top-0`}
      >
        {/* Brand / rail toggle */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-none"
            style={{ background: "var(--cc-card)", border: "1px solid var(--cc-glass-border)", boxShadow: "0 1px 2px var(--cc-shadow-soft)" }}
          >
            <span className="atlas-plex text-sm font-bold" style={{ color: "var(--cc-indigo-ink)" }}>A</span>
          </div>
          <div className={`min-w-0 flex-1 ${effCollapsed ? "hidden" : ""}`}>
            <h1 className="atlas-plex text-[14px] font-semibold leading-tight truncate" style={{ color: "var(--cc-glass-ink)" }}>Atlas</h1>
            <p className="text-[10px] truncate leading-tight" style={{ color: "var(--cc-glass-ink-dim)" }}>Agapitos Kalafatas</p>
          </div>
          <button
            onClick={toggleRail}
            title={effCollapsed ? t.expandRail : t.collapseRail}
            aria-label={effCollapsed ? t.expandRail : t.collapseRail}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-white/10 shrink-0"
            style={{ color: "var(--cc-glass-ink-dim)" }}
          >
            {effCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Search affordance (global search is a later foundation) */}
        <div className={`px-4 pb-2 ${effCollapsed ? "hidden" : ""}`}>
          <div className="atlas-glass-pill flex items-center gap-2 h-9 px-3" title={t.search}>
            <Search className="w-4 h-4 flex-none opacity-70" />
            <span className="flex-1 text-[12.5px] truncate">{t.search}</span>
            <span className="atlas-mono text-[9.5px] px-1.5 py-0.5 rounded flex-none" style={{ background: "var(--cc-card)", color: "var(--cc-glass-ink-dim)" }}>⌘K</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-1 space-y-2 overflow-y-auto">
          {NAV_GROUPS.map((group) => {
            const Icon = group.icon;
            const open = group.id === pinnedGroupId || openGroupId === group.id;
            const activeGroup = activeItemKey ? groupByItemKey(activeItemKey)?.id === group.id : false;
            const items = group.items.filter((it) => !(hidePlanned && it.state === "planned"));
            if (items.length === 0 && !effCollapsed) return null;

            if (effCollapsed) {
              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setRailCollapsed(false);
                    toggleGroup(group.id);
                  }}
                  title={group.label}
                  aria-label={group.label}
                  className="atlas-rail-tile"
                  style={
                    activeGroup
                      ? { background: "var(--cc-glass-active)", color: "var(--cc-indigo)" }
                      : undefined
                  }
                >
                  <Icon className="w-[18px] h-[18px]" />
                </button>
              );
            }

            return (
              <div key={group.id} className="atlas-nav-group" style={{ "--nav-accent": group.accent } as React.CSSProperties}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={open}
                  aria-controls={`nav-group-${group.id}`}
                  className="atlas-nav-group-header"
                >
                  <span className="atlas-nav-tile" style={{ background: `color-mix(in srgb, var(--cc-card) 68%, ${group.accent} 32%)` }}>
                    <Icon className="w-[18px] h-[18px]" style={{ color: group.accent }} />
                  </span>
                  <span className="atlas-nav-group-name" style={activeGroup ? { color: "var(--cc-indigo-ink)" } : undefined}>
                    {group.label}
                  </span>
                  {!open && groupMeta(group) !== "" && <span className="atlas-nav-meta">{groupMeta(group)}</span>}
                  {group.id === pinnedGroupId ? (
                    <ChevronDown className="atlas-chevron w-[14px] h-[14px] opacity-40" />
                  ) : (
                    <ChevronDown className={`atlas-chevron w-[14px] h-[14px] ${open ? "atlas-chevron-open" : "atlas-chevron-closed"}`} />
                  )}
                </button>
                {open && (
                  <div id={`nav-group-${group.id}`} className="space-y-0.5 mt-0.5">
                    {items.map((item) => (
                      <SidebarItem
                        key={item.key}
                        item={item}
                        active={isActive(item)}
                        count={item.key === "attention" ? status?.attentionTotal : undefined}
                        onClick={() => onItemClick(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer — quieter than navigation */}
        <div className="px-3 py-2.5 space-y-2" style={{ borderTop: "1px solid var(--cc-glass-border)" }}>
          {effCollapsed ? (
            <div className="flex flex-col items-center gap-1">
              <Legend t={t} />
              <button
                onClick={() => setHidePlanned((v) => !v)}
                aria-pressed={hidePlanned}
                title={t.hidePlanned}
                aria-label={t.hidePlanned}
                className="atlas-rail-tile"
              >
                <EyeOff className="w-[17px] h-[17px]" />
              </button>
              <FinishSwitch collapsed />
              <button
                onClick={logout}
                title={t.logout}
                aria-label={t.logout}
                className="atlas-rail-tile"
              >
                <LogOut className="w-[17px] h-[17px]" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-1">
                <MaturityDot state="live" />
                <span className="atlas-mono text-[11px]" style={{ color: "var(--cc-glass-ink)" }}>
                  {counts.live + counts.beta} live · {counts.planned} planned
                </span>
                <div className="flex-1" />
                <div className="hidden sm:block"><Legend t={t} /></div>
              </div>
              <label className="flex items-center gap-2 text-[11.5px] cursor-pointer select-none px-1" style={{ color: "var(--cc-glass-ink-dim)" }}>
                <EyeOff className="w-3.5 h-3.5 flex-none" />
                <input
                  type="checkbox"
                  checked={hidePlanned}
                  onChange={(e) => setHidePlanned(e.target.checked)}
                  className="accent-[var(--cc-indigo)]"
                />
                {t.hidePlanned}
              </label>
              <div className="flex items-center justify-between gap-2 px-0.5">
                <FinishSwitch />
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] transition-colors"
                  style={{ color: "var(--cc-glass-ink-dim)" }}
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className={effCollapsed ? "hidden" : ""}>{t.logout}</span>
                </button>
              </div>
              <div className="sm:hidden"><Legend t={t} /></div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay + close button */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
          <button
            className="fixed left-[250px] top-3 z-[55] md:hidden p-2 rounded-lg"
            style={{ background: "var(--cc-card)", color: "var(--cc-glass-ink)" }}
            onClick={() => setSidebarOpen(false)}
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <ShellTopBar
          breadcrumbs={breadcrumbs}
          headerRight={headerRight}
          lang={lang}
          setLang={setLang}
          t={t}
          status={status}
          onOpenMenu={() => setSidebarOpen(true)}
          onChangeLang={setLang}
        />
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