import { cookies, headers } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_BACKUP,
  extractTokenFromHeaders,
  verifySessionToken,
} from "@/lib/session";

export type SessionUser = {
  id: number;
  username: string;
  name: string;
  role: string;
};

export type SessionContext = {
  user: SessionUser;
  token: string;
};

export async function getSessionContext(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const tokenFromCookie =
    cookieStore.get(SESSION_COOKIE)?.value ??
    cookieStore.get(SESSION_COOKIE_BACKUP)?.value ??
    cookieStore.get("psmo_token")?.value ??
    null;

  const tokenFromHeader = extractTokenFromHeaders(headerStore);
  const token = tokenFromCookie ?? tokenFromHeader;
  const payload = await verifySessionToken(token);

  if (!payload || !token) return null;

  return {
    token,
    user: {
      id: payload.userId,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    },
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const context = await getSessionContext();
  return context?.user ?? null;
}
