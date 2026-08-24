import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { seedUsersIfEmpty } from "@/lib/seed";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await seedUsersIfEmpty();

    const body = (await request.json()) as { username?: string; password?: string };
    const username = (body.username ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 },
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    });

    // Audit trail: record who signed in and when.
    try {
      await db.insert(activityLogs).values({
        module: "auth",
        action: "signed-in",
        referenceId: user.id,
        details: `${user.name} signed in to the PSMO system`,
        actor: user.name,
      });
    } catch (logError) {
      console.error("Unable to write sign-in log:", logError);
    }

    const response = NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      token,
    });

    // For Arena preview (iframe) we need SameSite=None + Secure to allow the cookie inside cross-site iframe.
    // The preview is always https, so Secure=true is safe.
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { error: "Sign-in failed. Please try again or contact the PSMO administrator." },
      { status: 500 },
    );
  }
}
