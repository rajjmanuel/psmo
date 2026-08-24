import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth-server";
import { hashPassword } from "@/lib/password";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await params;
    const userId = Number(id);
    const body = (await request.json()) as {
      name?: string;
      role?: string;
      active?: boolean;
      password?: string;
      actor?: string;
    };

    const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // Protect the system: an admin cannot lock themselves out.
    if (existing.id === guard.user.id) {
      if (body.active === false) {
        return NextResponse.json(
          { error: "You cannot deactivate your own account." },
          { status: 400 },
        );
      }
      if (body.role && body.role !== "admin") {
        return NextResponse.json(
          { error: "You cannot remove your own admin role." },
          { status: 400 },
        );
      }
    }

    if (body.role && !VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
    }

    if (body.password && body.password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    await db
      .update(users)
      .set({
        name: body.name ? body.name.trim() : undefined,
        role: body.role ?? undefined,
        active: body.active !== undefined ? body.active : undefined,
        passwordHash: body.password ? hashPassword(body.password) : undefined,
      })
      .where(eq(users.id, userId))
      ;
    const [row] = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        role: users.role,
        active: users.active,
      }).from(users).where(eq(users.id, userId));

    // Build a readable audit entry describing exactly what changed.
    const changes: string[] = [];
    if (body.name && body.name.trim() !== existing.name) changes.push("name");
    if (body.role && body.role !== existing.role) changes.push(`role → ${body.role}`);
    if (body.active !== undefined && body.active !== existing.active) {
      changes.push(body.active ? "reactivated" : "deactivated");
    }
    if (body.password) changes.push("password reset");

    await db.insert(activityLogs).values({
      module: "users",
      action: body.password && changes.length === 1 ? "password-reset" : "updated",
      referenceId: row.id,
      details: `Updated account "${row.username}"${
        changes.length ? ` — ${changes.join(", ")}` : ""
      }`,
      actor: body.actor ?? guard.user.name,
    });

    return NextResponse.json(row);
  } catch (error: any) {
    console.error("Update user failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating the account." },
      { status: 500 },
    );
  }
}
