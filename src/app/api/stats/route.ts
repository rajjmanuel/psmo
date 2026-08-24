import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, assets, disposalRequests, procurementRequests } from "@/db/schema";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  await seedIfEmpty();

  const [assetCount] = await db.select({ n: count() }).from(assets);
  const [serviceable] = await db
    .select({ n: count() })
    .from(assets)
    .where(eq(assets.status, "serviceable"));
  const [forDisposal] = await db
    .select({ n: count() })
    .from(assets)
    .where(eq(assets.status, "for-disposal"));
  const [unserviceable] = await db
    .select({ n: count() })
    .from(assets)
    .where(eq(assets.status, "unserviceable"));
  const [valueRow] = await db
    .select({
      total: sql<string>`coalesce(sum(${assets.unitCost}), 0)`,
    })
    .from(assets);

  const [openDisposals] = await db
    .select({ n: count() })
    .from(disposalRequests)
    .where(sql`${disposalRequests.status} not in ('disposed', 'rejected')`);

  const [openProcurements] = await db
    .select({ n: count() })
    .from(procurementRequests)
    .where(sql`${procurementRequests.status} not in ('completed', 'rejected')`);

  const logs = await db
    .select()
    .from(activityLogs)
    .orderBy(sql`${activityLogs.createdAt} desc`)
    .limit(8);

  const statusRows = await db
    .select({
      status: assets.status,
      n: count(),
    })
    .from(assets)
    .groupBy(assets.status);

  return Response.json({
    assets: assetCount.n,
    serviceable: serviceable.n,
    forDisposal: forDisposal.n,
    unserviceable: unserviceable.n,
    inventoryValue: valueRow.total,
    openDisposals: openDisposals.n,
    openProcurements: openProcurements.n,
    logs,
    byStatus: statusRows,
  });
}
