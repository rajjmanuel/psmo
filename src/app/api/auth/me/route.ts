import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_BACKUP,
  extractTokenFromHeaders,
  verifySessionToken,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const token =
    cookieStore.get(SESSION_COOKIE)?.value ??
    cookieStore.get(SESSION_COOKIE_BACKUP)?.value ??
    cookieStore.get("psmo_token")?.value ??
    extractTokenFromHeaders(headerStore) ??
    null;

  const payload = await verifySessionToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: payload.userId,
    username: payload.username,
    name: payload.name,
    role: payload.role,
  });
}
