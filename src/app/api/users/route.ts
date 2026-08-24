import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth-server";
import { hashPassword } from "@/lib/password";
import { seedUsersIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["admin", "staff", "amt", "ssmt", "accounting"];

type AdminGuard =
  | { ok: false; error: string; status: 401 | 403 }
  | { ok: true; user: { id: number; username: string; name: string; role: string } };

async function requireAdmin(): Promise<AdminGuard> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Unauthorized", status: 401 };
  if (user.role !== "admin") {
    return {
      ok: false,
      error: "Only a PSMO Admin can manage user accounts.",
      status: 403,
    };
  }
  return { ok: true, user };
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  await seedUsersIfEmpty();

  // Never return password hashes to the client.
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      name?: string;
      role?: string;
      actor?: string;
    };

    const username = (body.username ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const name = (body.name ?? "").trim();
    const role = body.role ?? "staff";

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: "Full name, username, and password are required." },
        { status: 400 },
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
    }

    const [{ id }] = await db
      .insert(users)
      .values({
        username,
        passwordHash: hashPassword(password),
        name,
        role,
        active: true,
      })
      .$returningId();
    const [row] = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        role: users.role,
        active: users.active,
      }).from(users).where(eq(users.id, id));

    await db.insert(activityLogs).values({
      module: "users",
      action: "created",
      referenceId: row.id,
      details: `Created account "${row.username}" for ${row.name} (${row.role})`,
      actor: body.actor ?? guard.user.name,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505" || error?.cause?.code === "23505") {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 400 },
      );
    }
    console.error("Create user failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while creating the account." },
      { status: 500 },
    );
  }
}
