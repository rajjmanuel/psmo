import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, assets, disposalItems, disposalRequests, offices } from "@/db/schema";
import { nextDisposalNo } from "@/lib/next-number";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await seedIfEmpty();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const rows = await db
    .select({
      id: disposalRequests.id,
      requestNo: disposalRequests.requestNo,
      officeId: disposalRequests.officeId,
      officeName: offices.name,
      officeType: offices.type,
      requestedBy: disposalRequests.requestedBy,
      requestDate: disposalRequests.requestDate,
      status: disposalRequests.status,
      endorsementType: disposalRequests.endorsementType,
      endorsementRef: disposalRequests.endorsementRef,
      verification: disposalRequests.verification,
      reason: disposalRequests.reason,
      remarks: disposalRequests.remarks,
      createdAt: disposalRequests.createdAt,
    })
    .from(disposalRequests)
    .leftJoin(offices, eq(disposalRequests.officeId, offices.id))
    .where(status ? eq(disposalRequests.status, status) : undefined)
    .orderBy(desc(disposalRequests.createdAt));

  const ids = rows.map((r) => r.id);
  const itemCounts =
    ids.length === 0
      ? []
      : await db
          .select({
            disposalRequestId: disposalItems.disposalRequestId,
            n: sql<number>`count(*)`,
          })
          .from(disposalItems)
          .where(inArray(disposalItems.disposalRequestId, ids))
          .groupBy(disposalItems.disposalRequestId);

  const countMap = Object.fromEntries(itemCounts.map((c) => [c.disposalRequestId, Number(c.n)]));

  return Response.json(rows.map((r) => ({ ...r, itemCount: countMap[r.id] ?? 0 })));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      officeId?: number;
      requestedBy?: string;
      requestDate?: string;
      reason?: string;
      remarks?: string;
      assetIds?: number[];
      actor?: string;
    };

    if (!body.requestedBy || !body.requestDate) {
      return Response.json({ error: "Requested by and date are required." }, { status: 400 });
    }

    const requestNo = await nextDisposalNo();
    const [{ id }] = await db
      .insert(disposalRequests)
      .values({
        requestNo,
        officeId: body.officeId ? Number(body.officeId) : null,
        requestedBy: body.requestedBy,
        requestDate: body.requestDate,
        reason: body.reason ?? null,
        remarks: body.remarks ?? null,
        status: "requested",
      })
      .$returningId();
    const [row] = await db.select().from(disposalRequests).where(eq(disposalRequests.id, id));

    const assetIds = Array.isArray(body.assetIds) ? body.assetIds.map(Number) : [];
    if (assetIds.length) {
      await db.insert(disposalItems).values(
        assetIds.map((assetId) => ({
          disposalRequestId: row.id,
          assetId,
          reason: body.reason ?? null,
        })),
      );
      await db
        .update(assets)
        .set({ status: "for-disposal", updatedAt: new Date() })
        .where(inArray(assets.id, assetIds));
    }

    await db.insert(activityLogs).values({
      module: "disposal",
      action: "requested",
      referenceId: row.id,
      details: `Opened disposal ${requestNo} upon request of offices & laboratory`,
      actor: body.actor ?? body.requestedBy,
    });

    return Response.json(row, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505" || error?.cause?.code === "23505") {
      return Response.json({ error: "A request with this number already exists." }, { status: 400 });
    }
    return Response.json({ error: "An unexpected error occurred while saving." }, { status: 500 });
  }
}
