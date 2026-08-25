import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { offices, procurementRequests, procurementUnits } from "@/db/schema";
import { ProcurementRequestModal, ProcurementUnitForm } from "@/components/CrudModals";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PROCUREMENT_STATUSES } from "@/lib/constants";
import { formatDate, peso } from "@/lib/format";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function ProcurementPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; unit?: string }>;
}) {
  await seedIfEmpty();
  const { status, unit } = await searchParams;
  const officeRows = await db.select().from(offices).orderBy(offices.name);
  const unitRows = await db
    .select({ unit: procurementRequests.unit })
    .from(procurementRequests)
    .groupBy(procurementRequests.unit);
  const unitRecords = await db.select().from(procurementUnits).orderBy(procurementUnits.name);
  const procurementUnitNames = Array.from(new Set(["AMT", "SSMT", ...unitRecords.map((row) => row.name), ...unitRows.map((row) => row.unit)]));

  const rows = await db
    .select({
      id: procurementRequests.id,
      requestNo: procurementRequests.requestNo,
      unit: procurementRequests.unit,
      itemName: procurementRequests.itemName,
      quantity: procurementRequests.quantity,
      estimatedCost: procurementRequests.estimatedCost,
      status: procurementRequests.status,
      controlNo: procurementRequests.controlNo,
      mrrNo: procurementRequests.mrrNo,
      requestedBy: procurementRequests.requestedBy,
      requestDate: procurementRequests.requestDate,
      officeName: offices.name,
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

  return (
    <div>
      <PageHeader
        kicker="For Procurement"
        title="Canvass to MRR"
        description="Upon request of AMT & SSMT. Comparative report, approval, P.O. with control no., after check payment, then Material Receiving Report issued by PSMO."
        actions={
          <div className="flex flex-wrap gap-2">
            <ProcurementUnitForm units={unitRecords} />
            <ProcurementRequestModal offices={officeRows} units={procurementUnitNames} label="New request" />
          </div>
        }
      />

      <form className="mb-5 flex flex-wrap gap-2">
        <select name="unit" defaultValue={unit ?? ""} className="field max-w-[190px]">
          <option value="">All requesting units</option>
          {procurementUnitNames.map((unitName) => (
            <option key={unitName} value={unitName}>
              {unitName}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="field max-w-xs">
          <option value="">All stages</option>
          {PROCUREMENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button className="btn-ghost">Filter</button>
        <Link href="/procurement" className="btn-ghost">
          Reset
        </Link>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title="No procurement requests"
          body="Use the New request button above to open the procurement transaction modal."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#e4dccb] bg-white">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
              <tr>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Estimate</th>
                <th className="px-4 py-3">P.O. / MRR</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#eee6d6] hover:bg-[#fbf7ef]">
                  <td className="px-4 py-3">
                    <Link href={`/procurement/${row.id}`} className="font-medium hover:underline">
                      {row.requestNo}
                    </Link>
                    <div className="text-xs text-[#8a8070]">
                      {row.requestedBy} · {formatDate(row.requestDate)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.itemName}
                    <div className="text-xs text-[#8a8070]">{row.officeName ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">{row.unit}</td>
                  <td className="px-4 py-3">{row.quantity}</td>
                  <td className="px-4 py-3">{peso(row.estimatedCost)}</td>
                  <td className="px-4 py-3 text-xs">
                    <div>{row.controlNo ?? "No P.O. yet"}</div>
                    <div>{row.mrrNo ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={row.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/procurement/${row.id}`}
                      aria-label={`View ${row.requestNo}`}
                      title="View request"
                      className="btn-ghost !h-9 !w-9 !p-0"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
