import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, assets, disposalRequests, offices, procurementRequests } from "@/db/schema";
import { seedIfEmpty } from "@/lib/seed";
import { getSessionUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  await seedIfEmpty();
  const rows = await db.select().from(offices).orderBy(offices.type, offices.name);
  return Response.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      code?: string;
      type?: string;
      head?: string;
      floor?: string;
      contact?: string;
      actor?: string;
    };

    if (!body.name || !body.code || !body.type) {
      return Response.json({ error: "Name, code, and type are required." }, { status: 400 });
    }

    const [{ id }] = await db
      .insert(offices)
      .values({
        name: body.name,
        code: body.code.toUpperCase(),
        type: body.type,
        head: body.head ?? null,
        floor: body.floor ?? null,
        contact: body.contact ?? null,
      })
      .$returningId();
    const [row] = await db.select().from(offices).where(eq(offices.id, id));

    await db.insert(activityLogs).values({
      module: "offices",
      action: "created",
      referenceId: row.id,
      details: `Added ${body.type} ${body.name}`,
      actor: body.actor ?? "PSMO Staff",
    });

    return Response.json(row, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505" || error?.cause?.code === "23505") {
      return Response.json({ error: "An office or laboratory with this code already exists." }, { status: 400 });
    }
    return Response.json({ error: "An unexpected error occurred while saving." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "admin") {
      return Response.json({ error: "Only administrators can delete offices or laboratories." }, { status: 403 });
    }

    const body = (await request.json()) as { id?: number; actor?: string };
    if (!body.id) return Response.json({ error: "Office or laboratory id is required." }, { status: 400 });

    const [office] = await db.select().from(offices).where(eq(offices.id, Number(body.id)));
    if (!office) return Response.json({ error: "Office or laboratory not found." }, { status: 404 });

    const [[assetCount], [disposalCount], [procurementCount]] = await Promise.all([
      db.select({ n: count() }).from(assets).where(eq(assets.officeId, office.id)),
      db.select({ n: count() }).from(disposalRequests).where(eq(disposalRequests.officeId, office.id)),
      db.select({ n: count() }).from(procurementRequests).where(eq(procurementRequests.officeId, office.id)),
    ]);
    const linkedRecords = {
      inventory: Number(assetCount.n),
      disposal: Number(disposalCount.n),
      procurement: Number(procurementCount.n),
    };
    const linkedTotal = linkedRecords.inventory + linkedRecords.disposal + linkedRecords.procurement;
    if (linkedTotal > 0) {
      return Response.json(
        {
          error: `Cannot delete ${office.name}. Linked records: Inventory: ${linkedRecords.inventory}, Disposal requests: ${linkedRecords.disposal}, Procurement requests: ${linkedRecords.procurement}.`,
          linkedRecords,
        },
        { status: 409 },
      );
    }

    await db.delete(offices).where(eq(offices.id, office.id));
    await db.insert(activityLogs).values({
      module: "offices",
      action: "deleted",
      referenceId: office.id,
      details: `Removed ${office.type} ${office.name}`,
      actor: body.actor ?? "PSMO Staff",
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to delete office or laboratory." }, { status: 500 });
  }
}
