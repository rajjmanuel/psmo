"use client";

function readClientToken() {
  try {
    const fromLocal = window.localStorage.getItem("psmo_token");
    if (fromLocal) return fromLocal;
  } catch {
    /* continue */
  }

  try {
    const fromSession = window.sessionStorage.getItem("psmo_token");
    if (fromSession) return fromSession;
  } catch {
    /* continue */
  }

  try {
    const match = document.cookie.match(/(?:^|;\s*)psmo_token=([^;]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
    const backup = document.cookie.match(/(?:^|;\s*)psmo_session_backup=([^;]+)/);
    if (backup?.[1]) return decodeURIComponent(backup[1]);
    const primary = document.cookie.match(/(?:^|;\s*)psmo_session=([^;]+)/);
    if (primary?.[1]) return decodeURIComponent(primary[1]);
  } catch {
    /* continue */
  }

  return null;
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = readClientToken();

  if (token) {
    // Use two header names because some embedded preview layers strip Authorization.
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("X-PSMO-Token", token);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
    cache: init.cache ?? "no-store",
  });
}
