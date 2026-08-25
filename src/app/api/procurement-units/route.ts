import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, procurementUnits } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await db.select().from(procurementUnits).orderBy(asc(procurementUnits.name)));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; actor?: string };
    const name = body.name?.trim().toUpperCase();
    if (!name) return Response.json({ error: "Requesting unit name is required." }, { status: 400 });

    const [{ id }] = await db.insert(procurementUnits).values({ name }).$returningId();
    const [row] = await db.select().from(procurementUnits).where(eq(procurementUnits.id, id));
    await db.insert(activityLogs).values({
      module: "procurement",
      action: "unit-created",
      referenceId: row.id,
      details: `Added requesting unit ${row.name}`,
      actor: body.actor ?? "PSMO Staff",
    });
    return Response.json(row, { status: 201 });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY" || error?.errno === 1062) {
      return Response.json({ error: "This requesting unit already exists." }, { status: 400 });
    }
    return Response.json({ error: "Unable to add requesting unit." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { id?: number; actor?: string };
    if (!body.id) return Response.json({ error: "Requesting unit id is required." }, { status: 400 });

    const [row] = await db.select().from(procurementUnits).where(eq(procurementUnits.id, Number(body.id)));
    if (!row) return Response.json({ error: "Requesting unit not found." }, { status: 404 });

    await db.delete(procurementUnits).where(eq(procurementUnits.id, row.id));
    await db.insert(activityLogs).values({
      module: "procurement",
      action: "unit-deleted",
      referenceId: row.id,
      details: `Removed requesting unit ${row.name}`,
      actor: body.actor ?? "PSMO Staff",
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to delete requesting unit." }, { status: 500 });
  }
}
