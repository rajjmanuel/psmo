import { eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, assets, disposalItems, disposalRequests, offices } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db
    .select({
      id: disposalRequests.id,
      requestNo: disposalRequests.requestNo,
      officeId: disposalRequests.officeId,
      officeName: offices.name,
      officeCode: offices.code,
      officeType: offices.type,
      requestedBy: disposalRequests.requestedBy,
      requestDate: disposalRequests.requestDate,
      status: disposalRequests.status,
      endorsementType: disposalRequests.endorsementType,
      endorsementRef: disposalRequests.endorsementRef,
      endorsedBy: disposalRequests.endorsedBy,
      endorsedAt: disposalRequests.endorsedAt,
      verification: disposalRequests.verification,
      verifiedBy: disposalRequests.verifiedBy,
      verifiedAt: disposalRequests.verifiedAt,
      approvedBy: disposalRequests.approvedBy,
      approvedAt: disposalRequests.approvedAt,
      reason: disposalRequests.reason,
      remarks: disposalRequests.remarks,
      createdAt: disposalRequests.createdAt,
      updatedAt: disposalRequests.updatedAt,
    })
    .from(disposalRequests)
    .leftJoin(offices, eq(disposalRequests.officeId, offices.id))
    .where(eq(disposalRequests.id, Number(id)))
    .limit(1);

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const items = await db
    .select({
      id: disposalItems.id,
      assetId: disposalItems.assetId,
      reason: disposalItems.reason,
      condition: disposalItems.condition,
      taggingNo: assets.taggingNo,
      description: assets.description,
      brand: assets.brand,
      model: assets.model,
      serialNo: assets.serialNo,
      status: assets.status,
    })
    .from(disposalItems)
    .innerJoin(assets, eq(disposalItems.assetId, assets.id))
    .where(eq(disposalItems.disposalRequestId, row.id));

  return Response.json({ ...row, items });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, string | null | undefined>;
  const actor = body.actor ?? "PSMO Staff";
  const action = body.action;

  const existing = await db
    .select()
    .from(disposalRequests)
    .where(eq(disposalRequests.id, Number(id)))
    .limit(1);
  if (!existing[0]) return Response.json({ error: "Not found" }, { status: 404 });

  const patch: Partial<typeof disposalRequests.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (action === "endorse") {
    patch.status = "endorsed";
    patch.endorsementType = body.endorsementType ?? "both";
    patch.endorsementRef = body.endorsementRef ?? null;
    patch.endorsedBy = actor;
    patch.endorsedAt = new Date();
  } else if (action === "verify") {
    patch.status = "verified";
    patch.verification = body.verification ?? "beyond-repair";
    patch.verifiedBy = actor;
    patch.verifiedAt = new Date();
  } else if (action === "approve") {
    patch.status = "approved";
    patch.approvedBy = actor;
    patch.approvedAt = new Date();
  } else if (action === "dispose") {
    patch.status = "disposed";
    const items = await db
      .select()
      .from(disposalItems)
      .where(eq(disposalItems.disposalRequestId, Number(id)));
    for (const item of items) {
      await db
        .update(assets)
        .set({ status: "disposed", updatedAt: new Date() })
        .where(eq(assets.id, item.assetId));
    }
  } else if (action === "reject") {
    patch.status = "rejected";
    patch.remarks = body.remarks ?? existing[0].remarks;
  } else {
    if (body.reason !== undefined) patch.reason = body.reason;
    if (body.remarks !== undefined) patch.remarks = body.remarks;
  }

  await db
    .update(disposalRequests)
    .set(patch)
    .where(eq(disposalRequests.id, Number(id)))
    ;
  const [row] = await db.select().from(disposalRequests).where(eq(disposalRequests.id, Number(id)));

  await db.insert(activityLogs).values({
    module: "disposal",
    action: action ?? "updated",
    referenceId: row.id,
    details: `${action ?? "updated"} ${row.requestNo}`,
    actor,
  });

  return Response.json(row);
}
