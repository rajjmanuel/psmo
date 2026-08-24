"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthProvider, type AuthUser } from "@/components/AuthProvider";

function persistToken(token: string) {
  try {
    localStorage.setItem("psmo_token", token);
  } catch {
    /* continue */
  }
  try {
    sessionStorage.setItem("psmo_token", token);
  } catch {
    /* continue */
  }
  try {
    // Non-HttpOnly copies make the token available to the modal fetch helper.
    document.cookie = `psmo_token=${encodeURIComponent(token)}; Path=/; Max-Age=43200; SameSite=Lax`;
    document.cookie = `psmo_session_backup=${token}; Path=/; Max-Age=43200; SameSite=Lax`;
  } catch {
    /* continue */
  }
}

function decodeToken(token: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const payloadB64 = parts[0];
    const padded = payloadB64 + "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as {
      userId: number;
      username: string;
      name: string;
      role: string;
      exp: number;
    };
    if (!payload.exp || payload.exp < Date.now()) return null;
    return {
      id: payload.userId,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function ClientDashboard({
  serverUser,
  sessionToken,
  children,
}: {
  serverUser: AuthUser | null;
  sessionToken: string | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(serverUser);
  const [checking, setChecking] = useState(!serverUser);

  useEffect(() => {
    // Critical fix: the server may know the user via an HttpOnly cookie while the
    // browser-side modal cannot read that cookie. Persist the server token for authFetch().
    if (sessionToken) {
      persistToken(sessionToken);
    }

    if (serverUser) {
      setChecking(false);
      return;
    }

    try {
      const token = localStorage.getItem("psmo_token") || sessionStorage.getItem("psmo_token");
      if (!token) {
        window.location.replace("/login");
        return;
      }

      const decoded = decodeToken(token);
      if (!decoded) {
        localStorage.removeItem("psmo_token");
        sessionStorage.removeItem("psmo_token");
        window.location.replace("/login");
        return;
      }

      persistToken(token);
      setUser(decoded);
      setChecking(false);
    } catch {
      window.location.replace("/login");
    }
  }, [serverUser, sessionToken]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fc] p-8">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-semibold text-slate-700">Opening PSMO dashboard…</p>
          <p className="mt-1 text-xs text-slate-500">Restoring secure session.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fc] p-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">No active session</p>
          <p className="mt-1 text-xs text-slate-500">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider user={user}>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
