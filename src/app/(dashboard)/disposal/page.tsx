import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { assets, disposalItems, disposalRequests, offices } from "@/db/schema";
import { DisposalRequestModal } from "@/components/CrudModals";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { DISPOSAL_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function DisposalPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await seedIfEmpty();
  const { status } = await searchParams;

  const officeRows = await db.select().from(offices).orderBy(offices.name);
  const assetRows = await db
    .select({
      id: assets.id,
      taggingNo: assets.taggingNo,
      description: assets.description,
      status: assets.status,
      officeName: offices.name,
    })
    .from(assets)
    .leftJoin(offices, eq(assets.officeId, offices.id))
    .orderBy(desc(assets.createdAt));

  const rows = await db
    .select({
      id: disposalRequests.id,
      requestNo: disposalRequests.requestNo,
      requestedBy: disposalRequests.requestedBy,
      requestDate: disposalRequests.requestDate,
      status: disposalRequests.status,
      endorsementType: disposalRequests.endorsementType,
      verification: disposalRequests.verification,
      reason: disposalRequests.reason,
      officeName: offices.name,
      officeType: offices.type,
    })
    .from(disposalRequests)
    .leftJoin(offices, eq(disposalRequests.officeId, offices.id))
    .where(status ? eq(disposalRequests.status, status) : undefined)
    .orderBy(desc(disposalRequests.createdAt));

  const ids = rows.map((r) => r.id);
  const counts =
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
  const countMap = Object.fromEntries(counts.map((c) => [c.disposalRequestId, Number(c.n)]));

  return (
    <div>
      <PageHeader
        kicker="For Disposal"
        title="Disposal requests"
        description="Upon request by Offices & Laboratory. Endorsement thru Excel & IOM, then verification — under warranty or beyond repair."
        actions={
          <DisposalRequestModal
            offices={officeRows}
            assets={assetRows}
            label="File request"
          />
        }
      />

      <form className="mb-5 flex flex-wrap gap-2">
        <select name="status" defaultValue={status ?? ""} className="field max-w-xs">
          <option value="">All stages</option>
          {DISPOSAL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button className="btn-ghost">Filter</button>
        <Link href="/disposal" className="btn-ghost">
          Reset
        </Link>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title="No disposal requests"
          body="Use the File request button above to open the disposal transaction modal."
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/disposal/${row.id}`}
              className="rounded-2xl border border-[#e4dccb] bg-white p-5 hover:border-[#c4a35a]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#8a7540]">
                    {row.requestNo}
                  </p>
                  <h2 className="font-display text-2xl">{row.officeName ?? "Unassigned unit"}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-[#5c564c]">{row.reason}</p>
                </div>
                <StatusBadge value={row.status} />
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#8a8070]">Requested by</dt>
                  <dd>{row.requestedBy}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#8a8070]">Date</dt>
                  <dd>{formatDate(row.requestDate)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#8a8070]">Endorsement</dt>
                  <dd className="capitalize">{row.endorsementType?.replace("-", " & ") ?? "Pending"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#8a8070]">Items</dt>
                  <dd>{countMap[row.id] ?? 0} tagged</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
