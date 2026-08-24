import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, offices, procurementRequests } from "@/db/schema";
import { nextProcurementNo } from "@/lib/next-number";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await seedIfEmpty();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const unit = searchParams.get("unit");

  const rows = await db
    .select({
      id: procurementRequests.id,
      requestNo: procurementRequests.requestNo,
      unit: procurementRequests.unit,
      officeId: procurementRequests.officeId,
      officeName: offices.name,
      requestedBy: procurementRequests.requestedBy,
      requestDate: procurementRequests.requestDate,
      itemName: procurementRequests.itemName,
      quantity: procurementRequests.quantity,
      estimatedCost: procurementRequests.estimatedCost,
      status: procurementRequests.status,
      controlNo: procurementRequests.controlNo,
      mrrNo: procurementRequests.mrrNo,
      supplier: procurementRequests.supplier,
      createdAt: procurementRequests.createdAt,
    })
    .from(procurementRequests)
    .leftJoin(offices, eq(procurementRequests.officeId, offices.id))
    .where(
      status
        ? eq(procurementRequests.status, status)
        : unit
          ? eq(procurementRequests.unit, unit)
          : undefined,
    )
    .orderBy(desc(procurementRequests.createdAt));

  return Response.json(rows);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string | number | null | undefined>;

    if (!body.itemName || !body.requestedBy || !body.unit || !body.requestDate) {
      return Response.json(
        { error: "Unit, item, requested by, and date are required." },
        { status: 400 },
      );
    }

    const requestNo = await nextProcurementNo();
    const [{ id }] = await db
      .insert(procurementRequests)
      .values({
        requestNo,
        unit: String(body.unit),
        officeId: body.officeId ? Number(body.officeId) : null,
        requestedBy: String(body.requestedBy),
        requestDate: String(body.requestDate),
        itemName: String(body.itemName),
        specifications: body.specifications ? String(body.specifications) : null,
        quantity: body.quantity ? Number(body.quantity) : 1,
        estimatedCost:
          body.estimatedCost != null && body.estimatedCost !== ""
            ? String(body.estimatedCost)
            : null,
        justification: body.justification ? String(body.justification) : null,
        status: "requested",
      })
      .$returningId();
    const [row] = await db.select().from(procurementRequests).where(eq(procurementRequests.id, id));

    await db.insert(activityLogs).values({
      module: "procurement",
      action: "requested",
      referenceId: row.id,
      details: `AMT/SSMT request ${requestNo}: ${row.itemName}`,
      actor: String(body.actor ?? body.requestedBy),
    });

    return Response.json(row, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505" || error?.cause?.code === "23505") {
      return Response.json({ error: "A request with this number already exists." }, { status: 400 });
    }
    return Response.json({ error: "An unexpected error occurred while saving." }, { status: 500 });
  }
}
