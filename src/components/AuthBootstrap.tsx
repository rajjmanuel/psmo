"use client";

import { useEffect, useState } from "react";

export function AuthBootstrap() {
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    // Only run on protected pages when server thought there was no session.
    // Try to restore from localStorage token for Arena iframe third-party cookie cases.
    try {
      const token = localStorage.getItem("psmo_token");
      if (!token) {
        setAttempted(true);
        return;
      }
      // Re-set cookies from localStorage as a backup (in case previous Set-Cookie was blocked).
      document.cookie = `psmo_session=${token}; Path=/; Max-Age=43200; SameSite=None; Secure`;
      document.cookie = `psmo_session_backup=${token}; Path=/; Max-Age=43200; SameSite=None; Secure`;

      // Verify token still valid by pinging a protected API with Authorization header.
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) {
            // Token valid, reload so server cookies are now present and dashboard renders.
            window.location.reload();
          } else {
            setAttempted(true);
          }
        })
        .catch(() => setAttempted(true));
    } catch {
      setAttempted(true);
    }
  }, []);

  useEffect(() => {
    if (attempted) {
      const timer = setTimeout(() => {
        window.location.replace("/login");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [attempted]);

  if (attempted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">No active session.</p>
          <p className="mt-1 text-xs text-slate-500">Redirecting to login…</p>
          <a href="/login" className="mt-3 inline-block font-semibold text-blue-600 underline">
            Go to login now
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-600">Restoring PSMO session…</p>
        <p className="mt-1 text-xs text-slate-400">Checking local backup token for Arena preview.</p>
      </div>
    </div>
  );
}
