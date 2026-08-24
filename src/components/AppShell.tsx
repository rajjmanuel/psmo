"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { roleLabel, useAuth, type AuthUser } from "@/components/AuthProvider";
import { useBranding } from "@/components/BrandingProvider";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/", label: "Dashboard", hint: "Overview" },
  { href: "/inventory", label: "Inventory for Stock", hint: "Tag & record" },
  { href: "/disposal", label: "For Disposal", hint: "Endorse & verify" },
  { href: "/procurement", label: "For Procurement", hint: "Canvass to MRR" },
  { href: "/offices", label: "Offices & Laboratories", hint: "Locations" },
  { href: "/reports", label: "Reports", hint: "PSMO digest" },
  { href: "/logs", label: "Activity Logs", hint: "Audit trail" },
  { href: "/users", label: "User Management", hint: "Staff accounts", adminOnly: true },
  { href: "/settings", label: "Settings", hint: "Brand & theme" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuth();
  const { settings } = useBranding();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const welcome = sessionStorage.getItem("psmo_welcome");
      if (welcome) {
        sessionStorage.removeItem("psmo_welcome");
        toast.success(`Welcome, ${welcome}!`, "You are signed in to the PSMO Asset Management System.");
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen grain print:!min-h-0 print:!bg-white">
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/10 text-[#f8fafc] lg:flex print:!hidden"
        style={{ background: settings.primaryDeep }}
      >
        <Brand />
        <Nav pathname={pathname} role={user.role} />
        <FooterNote user={user} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden print:!hidden">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <aside
            className="relative flex h-full w-72 flex-col text-[#f8fafc]"
            style={{ background: settings.primaryDeep }}
          >
            <Brand />
            <Nav pathname={pathname} role={user.role} />
            <FooterNote user={user} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72 print:!pl-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[var(--line)] bg-white/85 px-4 py-3 backdrop-blur md:px-8 print:!hidden">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1 text-sm lg:hidden"
              onClick={() => setOpen(true)}
            >
              Menu
            </button>
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: settings.primaryColor }}
              >
                {settings.systemTitle}
              </p>
              <p
                className="font-display text-lg leading-none tracking-tight"
                style={{ color: settings.primaryDeep }}
              >
                Process of {settings.shortName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserMenu user={user} />
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8 print:!p-0">{children}</main>
      </div>
    </div>
  );
}

function UserMenu({ user }: { user: AuthUser }) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      try {
        localStorage.removeItem("psmo_token");
        sessionStorage.removeItem("psmo_token");
        localStorage.removeItem("psmo_user");
        document.cookie = "psmo_token=; Path=/; Max-Age=0; SameSite=None; Secure";
        document.cookie = "psmo_token=; Path=/; Max-Age=0; SameSite=Lax";
        document.cookie = "psmo_session=; Path=/; Max-Age=0; SameSite=None; Secure";
        document.cookie = "psmo_session_backup=; Path=/; Max-Age=0; SameSite=Lax";
        document.cookie = "psmo_session=; Path=/; Max-Age=0; SameSite=Lax";
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(false);
      window.location.replace("/login");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold leading-tight text-[var(--ink)]">{user.name}</p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
          {roleLabel(user.role)}
        </p>
      </div>
      <button
        onClick={logout}
        disabled={busy}
        className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--primary-deep)] disabled:opacity-60"
      >
        {busy ? "Signing out…" : "Log out"}
      </button>
    </div>
  );
}

function Brand() {
  const { settings } = useBranding();
  const isData = settings.logoUrl.startsWith("data:");
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      {isData ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.logoUrl}
          alt={`${settings.shortName} seal`}
          className="h-14 w-14 rounded-full object-cover ring-2 ring-white/40"
        />
      ) : (
        <Image
          src={settings.logoUrl}
          alt={`${settings.shortName} seal`}
          width={56}
          height={56}
          className="h-14 w-14 rounded-full object-cover ring-2 ring-white/40"
          unoptimized
        />
      )}
      <div>
        <p className="font-display text-xl font-bold leading-none tracking-tight">
          {settings.shortName}
        </p>
        <p
          className="mt-1 text-[10px] uppercase tracking-[0.18em]"
          style={{ color: settings.accentColor }}
        >
          {settings.tagline}
        </p>
      </div>
    </div>
  );
}

function Nav({ pathname, role }: { pathname: string; role: string }) {
  const items = NAV.filter((item) => !item.adminOnly || role === "admin");
  return (
    <nav className="flex-1 space-y-1 px-3">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-xl px-3 py-2.5 transition",
              active
                ? "bg-white/15 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white",
            )}
          >
            <span className="block text-sm font-semibold tracking-tight">{item.label}</span>
            <span className="text-[11px] text-slate-400">{item.hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function FooterNote({ user }: { user: AuthUser }) {
  const { settings } = useBranding();
  return (
    <div className="border-t border-white/10 px-5 py-4 text-[11px] leading-relaxed text-slate-400">
      Logged in as{" "}
      <span className="font-semibold" style={{ color: settings.accentColor }}>
        {user.name}
      </span>{" "}
      · {roleLabel(user.role)}
    </div>
  );
}
