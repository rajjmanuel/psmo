import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, assets, disposalItems, disposalRequests, offices } from "@/db/schema";
import { nextDisposalNo } from "@/lib/next-number";
import { todayISO } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db
    .select({
      id: assets.id,
      taggingNo: assets.taggingNo,
      description: assets.description,
      brand: assets.brand,
      model: assets.model,
      serialNo: assets.serialNo,
      partsNo: assets.partsNo,
      dateOfPurchase: assets.dateOfPurchase,
      officeId: assets.officeId,
      officeName: offices.name,
      officeCode: offices.code,
      officeType: offices.type,
      locationNote: assets.locationNote,
      status: assets.status,
      category: assets.category,
      unitCost: assets.unitCost,
      source: assets.source,
      condition: assets.condition,
      remarks: assets.remarks,
      recordedBy: assets.recordedBy,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
    })
    .from(assets)
    .leftJoin(offices, eq(assets.officeId, offices.id))
    .where(eq(assets.id, Number(id)))
    .limit(1);

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, string | number | null | undefined>;
    const [existing] = await db.select().from(assets).where(eq(assets.id, Number(id)));

    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    const nextStatus = body.status ? String(body.status) : existing.status;

    await db
      .update(assets)
      .set({
        taggingNo: body.taggingNo ? String(body.taggingNo) : undefined,
        description: body.description ? String(body.description) : undefined,
        brand: body.brand !== undefined ? (body.brand ? String(body.brand) : null) : undefined,
        model: body.model !== undefined ? (body.model ? String(body.model) : null) : undefined,
        serialNo: body.serialNo !== undefined ? (body.serialNo ? String(body.serialNo) : null) : undefined,
        partsNo: body.partsNo !== undefined ? (body.partsNo ? String(body.partsNo) : null) : undefined,
        dateOfPurchase:
          body.dateOfPurchase !== undefined
            ? body.dateOfPurchase
              ? String(body.dateOfPurchase)
              : null
            : undefined,
        officeId: body.officeId !== undefined ? (body.officeId ? Number(body.officeId) : null) : undefined,
        locationNote:
          body.locationNote !== undefined
            ? body.locationNote
              ? String(body.locationNote)
              : null
            : undefined,
        status: body.status ? String(body.status) : undefined,
        category: body.category !== undefined ? (body.category ? String(body.category) : null) : undefined,
        unitCost:
          body.unitCost !== undefined
            ? body.unitCost != null && body.unitCost !== ""
              ? String(body.unitCost)
              : null
            : undefined,
        source: body.source ? String(body.source) : undefined,
        condition:
          body.condition !== undefined ? (body.condition ? String(body.condition) : null) : undefined,
        remarks: body.remarks !== undefined ? (body.remarks ? String(body.remarks) : null) : undefined,
        recordedBy: body.recordedBy ? String(body.recordedBy) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, Number(id)))
      ;
    const [row] = await db.select().from(assets).where(eq(assets.id, Number(id)));

    if (!row) return Response.json({ error: "Not found" }, { status: 404 });

    let disposalRequestNo: string | undefined;
    if (existing.status === "in-stock" && nextStatus === "for-disposal") {
      disposalRequestNo = await nextDisposalNo();
      const [{ id: disposalRequestId }] = await db
        .insert(disposalRequests)
        .values({
          requestNo: disposalRequestNo,
          officeId: row.officeId,
          requestedBy: body.actor ? String(body.actor) : "PSMO Staff",
          requestDate: todayISO(),
          reason: `Asset ${row.taggingNo} changed from In Stock to For Disposal.`,
          status: "requested",
        })
        .$returningId();

      await db.insert(disposalItems).values({
        disposalRequestId,
        assetId: row.id,
        reason: `Asset ${row.taggingNo} changed from In Stock to For Disposal.`,
      });
    }

    await db.insert(activityLogs).values({
      module: "inventory",
      action: "updated",
      referenceId: row.id,
      details: `Updated ${row.taggingNo} — ${row.status}`,
      actor: body.actor ? String(body.actor) : "PSMO Staff",
    });

    return Response.json({ ...row, disposalRequestNo });
  } catch (error: any) {
    if (
      error?.code === "23505" ||
      error?.cause?.code === "23505" ||
      error?.code === "ER_DUP_ENTRY" ||
      error?.errno === 1062 ||
      error?.cause?.errno === 1062
    ) {
      return Response.json({ error: "That Tagging No. is already in use by another item." }, { status: 400 });
    }
    return Response.json({ error: "An unexpected error occurred while updating." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const actor = new URL(request.url).searchParams.get("actor") ?? "PSMO Staff";

  const [row] = await db.select().from(assets).where(eq(assets.id, Number(id)));
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  await db.delete(assets).where(eq(assets.id, Number(id)));

  await db.insert(activityLogs).values({
    module: "inventory",
    action: "deleted",
    referenceId: row.id,
    details: `Removed ${row.taggingNo} — ${row.description}`,
    actor,
  });

  return Response.json({ ok: true });
}
