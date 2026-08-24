"use client";

/**
 * Shared helper to persist a freshly-issued session token on the client.
 * Used after login and after any action that re-issues the current user's
 * session (e.g. updating your own profile) so the UI reflects changes
 * immediately without requiring a logout/login cycle.
 */
export function persistSessionToken(token: string) {
  try {
    localStorage.setItem("psmo_token", token);
    sessionStorage.setItem("psmo_token", token);
  } catch {
    /* storage unavailable (private mode, quota, etc.) */
  }

  try {
    document.cookie = `psmo_token=${encodeURIComponent(token)}; Path=/; Max-Age=43200; SameSite=None; Secure`;
    document.cookie = `psmo_token=${encodeURIComponent(token)}; Path=/; Max-Age=43200; SameSite=Lax`;
    document.cookie = `psmo_session=${token}; Path=/; Max-Age=43200; SameSite=None; Secure`;
    document.cookie = `psmo_session_backup=${token}; Path=/; Max-Age=43200; SameSite=Lax`;
    document.cookie = `psmo_session=${token}; Path=/; Max-Age=43200; SameSite=Lax`;
  } catch {
    /* cookies unavailable */
  }
}

export function clearSessionToken() {
  try {
    localStorage.removeItem("psmo_token");
    sessionStorage.removeItem("psmo_token");
    localStorage.removeItem("psmo_user");
  } catch {
    /* ignore */
  }
  try {
    document.cookie = "psmo_token=; Path=/; Max-Age=0; SameSite=None; Secure";
    document.cookie = "psmo_token=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "psmo_session=; Path=/; Max-Age=0; SameSite=None; Secure";
    document.cookie = "psmo_session_backup=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "psmo_session=; Path=/; Max-Age=0; SameSite=Lax";
  } catch {
    /* ignore */
  }
}
