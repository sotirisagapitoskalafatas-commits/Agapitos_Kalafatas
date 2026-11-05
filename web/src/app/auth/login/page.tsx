"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

export default function AtlasLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        setError(result.error || "Δεν ήταν δυνατή η σύνδεση. Δοκιμάστε ξανά.");
        return;
      }

      const requestedNext = new URLSearchParams(window.location.search).get("next");
      const destination =
        requestedNext &&
        (requestedNext === "/admin" || requestedNext.startsWith("/admin/")) &&
        !requestedNext.includes("\\") &&
        !requestedNext.includes("://")
          ? requestedNext
          : "/admin/crm";
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Δεν ήταν δυνατή η επικοινωνία με την υπηρεσία σύνδεσης.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1020] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full bg-cyan-500/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-12">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-[0_32px_120px_rgba(0,0,0,.45)] backdrop-blur-2xl md:grid-cols-[1.05fr_.95fr]">
          <section className="hidden flex-col justify-between border-r border-white/10 bg-gradient-to-br from-indigo-500/15 via-transparent to-cyan-500/10 p-12 md:flex">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl font-bold shadow-lg shadow-indigo-950/30">
                  A
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-[0.18em]">ATLAS</p>
                  <p className="text-xs text-slate-400">AGAPITOS KALAFATAS</p>
                </div>
              </div>
              <div className="mt-24 max-w-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Command workspace
                </p>
                <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
                  Your work.<br />One clear view.
                </h1>
                <p className="mt-5 text-sm leading-7 text-slate-400">
                  A secure workspace for your operations, intelligence and customer relationships.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Protected server-side session
            </div>
          </section>

          <section className="p-7 sm:p-10 md:p-12">
            <div className="mb-9 md:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl font-bold">
                A
              </div>
              <p className="mt-3 text-sm font-semibold tracking-[0.18em]">ATLAS</p>
            </div>

            <div className="mb-8">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Secure sign in
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-400">
                Sign in to continue to your ATLAS workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="atlas-username" className="mb-2 block text-xs font-medium text-slate-300">
                  Username
                </label>
                <input
                  id="atlas-username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  maxLength={128}
                  className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
                  placeholder="Your username"
                />
              </div>

              <div>
                <label htmlFor="atlas-password" className="mb-2 block text-xs font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="atlas-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    maxLength={1024}
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || !username || !password}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                {busy ? "Signing in…" : "Sign in securely"}
              </button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => setRecoveryOpen((value) => !value)}
                aria-expanded={recoveryOpen}
                className="text-sm font-medium text-slate-400 transition hover:text-cyan-200"
              >
                {recoveryOpen ? "Hide access recovery" : "Forgot your password?"}
              </button>

              {recoveryOpen && (
                <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4 text-xs leading-6 text-slate-400">
                  <p className="font-semibold text-slate-200">Owner-managed password recovery</p>
                  <p className="mt-2">
                    Login credentials are currently managed in Vercel. Update
                    <code className="mx-1 text-cyan-200">ADMIN_USERNAME</code>
                    and
                    <code className="mx-1 text-cyan-200">ADMIN_PASSWORD</code>
                    for Production, save, then redeploy.
                  </p>
                  <p className="mt-2">
                    Keep
                    <code className="mx-1 text-cyan-200">AUTH_SECRET</code>
                    unchanged for a password-only reset. Rotating it signs out all active sessions.
                  </p>
                  <a
                    href="https://vercel.com/agapitos-kalafatas/web/settings/environment-variables"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center font-semibold text-cyan-200 hover:text-white"
                  >
                    Open Vercel environment settings ↗
                  </a>
                </div>
              )}
            </div>

            <p className="mt-8 text-center text-[11px] text-slate-600">
              ATLAS · Agapitos Kalafatas · Private workspace
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
