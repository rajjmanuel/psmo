import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth-server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Re-issues the current session token with the latest data from the
 * database. Call this right after a profile update (name/role change) so
 * the signed-in user sees the change immediately instead of needing to
 * log out and log back in.
 */
export async function POST() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!user || !user.active) {
    return NextResponse.json(
      { error: "Account not found or has been deactivated." },
      { status: 401 },
    );
  }

  const token = await createSessionToken({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });

  const response = NextResponse.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    token,
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
