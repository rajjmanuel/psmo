// Lightweight signed-session helper built on Web Crypto so it can run in
// both the Node.js runtime (API routes) and the Edge runtime (middleware).

export type SessionPayload = {
  userId: number;
  username: string;
  name: string;
  role: string;
  exp: number;
};

const configuredSecret = process.env.SESSION_SECRET;

// Treat an empty / whitespace env value as "not configured" so an empty
// SESSION_SECRET= never produces an unusable HMAC key.
const SESSION_SECRET =
  configuredSecret && configuredSecret.trim().length > 0
    ? configuredSecret
    : "psmo-asset-management-system-default-session-secret-v1";

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const payloadB64 = bytesToBase64Url(payloadBytes);
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigB64 = bytesToBase64Url(new Uint8Array(signature));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  try {
    const key = await getKey();
    const signatureBytes = base64UrlToBytes(sigB64);
    const messageBytes = encoder.encode(payloadB64);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes.slice().buffer,
      messageBytes.slice().buffer,
    );
    if (!valid) return null;

    const json = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "psmo_session";
export const SESSION_COOKIE_BACKUP = "psmo_session_backup";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export function extractTokenFromHeaders(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const xToken = headers.get("x-psmo-token");
  if (xToken) return xToken.trim();
  return null;
}
