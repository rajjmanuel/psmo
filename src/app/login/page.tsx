"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { useBranding } from "@/components/BrandingProvider";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white p-10 text-slate-500">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const { settings } = useBranding();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const logoIsData = settings.logoUrl.startsWith("data:");
  const heroIsData = settings.heroImageUrl.startsWith("data:");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as {
        error?: string;
        name?: string;
        token?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Unable to sign in.");
        setLoading(false);
        return;
      }

      if (data.token) {
        try {
          localStorage.setItem("psmo_token", data.token);
          sessionStorage.setItem("psmo_token", data.token);
          localStorage.setItem("psmo_user", JSON.stringify({ name: data.name, username }));
          // Client-readable backup token for embedded previews and authFetch().
          document.cookie = `psmo_token=${encodeURIComponent(data.token)}; Path=/; Max-Age=43200; SameSite=None; Secure`;
          document.cookie = `psmo_token=${encodeURIComponent(data.token)}; Path=/; Max-Age=43200; SameSite=Lax`;
          document.cookie = `psmo_session=${data.token}; Path=/; Max-Age=43200; SameSite=None; Secure`;
          document.cookie = `psmo_session_backup=${data.token}; Path=/; Max-Age=43200; SameSite=Lax`;
          document.cookie = `psmo_session=${data.token}; Path=/; Max-Age=43200; SameSite=Lax`;
        } catch {
          /* ignore */
        }
      }

      try {
        sessionStorage.setItem("psmo_welcome", data.name ?? username);
      } catch {
        /* ignore */
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        window.location.href = nextPath;
      }, 500);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="grain flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-[24px] border border-[var(--line)] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            ✓
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--ink)]">
            Signed in successfully!
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Redirecting to the dashboard…</p>
          <div className="mt-4 flex justify-center gap-1">
            <span
              className="h-2 w-2 animate-bounce rounded-full"
              style={{ background: "var(--primary)" }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full [animation-delay:0.1s]"
              style={{ background: "var(--primary)" }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full [animation-delay:0.2s]"
              style={{ background: "var(--primary)" }}
            />
          </div>
          <a
            href={nextPath}
            className="btn-primary mt-6 w-full"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = nextPath;
            }}
          >
            Open Dashboard →
          </a>
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            If you&apos;re not redirected automatically, click the button above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grain flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[var(--line)] bg-white shadow-2xl md:grid-cols-[1.05fr_0.95fr]">
        <div
          className="relative hidden md:block"
          style={{ background: settings.primaryDeep }}
        >
          {heroIsData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
          ) : (
            <Image
              src={settings.heroImageUrl}
              alt=""
              fill
              className="object-cover opacity-60"
              unoptimized
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${settings.primaryDeep}, ${settings.primaryDeep}b3, ${settings.primaryDeep}4d)`,
            }}
          />
          <div className="relative z-10 flex h-full flex-col justify-between p-8 text-white">
            <div className="flex items-center gap-3">
              {logoIsData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logoUrl}
                  alt=""
                  className="h-[52px] w-[52px] rounded-full object-cover ring-2"
                  style={{ boxShadow: `0 0 0 2px ${settings.accentColor}` }}
                />
              ) : (
                <Image
                  src={settings.logoUrl}
                  alt=""
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] rounded-full object-cover ring-2"
                  style={{ boxShadow: `0 0 0 2px ${settings.accentColor}` }}
                  unoptimized
                />
              )}
              <div>
                <p
                  className="text-[11px] uppercase tracking-[0.25em]"
                  style={{ color: settings.accentColor }}
                >
                  {settings.orgName}
                </p>
                <p className="font-display text-xl font-bold tracking-tight">
                  {settings.systemTitle}
                </p>
              </div>
            </div>
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: settings.accentColor }}
              >
                {settings.focalText}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-200">
                {settings.heroSubtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <div className="mb-6 flex items-center gap-3 md:hidden">
            {logoIsData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <Image
                src={settings.logoUrl}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-full"
                unoptimized
              />
            )}
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.22em]"
                style={{ color: settings.primaryColor }}
              >
                {settings.shortName}
              </p>
              <p className="font-display text-lg leading-none">{settings.systemTitle}</p>
            </div>
          </div>

          <p
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: settings.primaryColor }}
          >
            Sign in
          </p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-[var(--ink)]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{settings.loginWelcome}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[var(--ink)]">Username</span>
              <input
                className="field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[var(--ink)]">Password</span>
              <input
                type="password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? "Signing in…" : `Sign in to ${settings.shortName}`}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-4 text-xs leading-relaxed text-[var(--muted)]">
            <p className="font-semibold text-[var(--ink)]">Authorized users only</p>
            <p className="mt-1">
              Accounts are created by the PSMO Admin. Please contact the administrator if you need access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
