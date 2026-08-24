import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  assets,
  disposalRequests,
  offices,
  procurementRequests,
} from "@/db/schema";
import { PageHeader } from "@/components/PageHeader";
import { PrintButton } from "@/components/PrintButton";
import { PrintLetterhead } from "@/components/PrintLetterhead";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, peso } from "@/lib/format";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await seedIfEmpty();

  const byStatus = await db
    .select({ status: assets.status, n: count(), value: sql<string>`coalesce(sum(${assets.unitCost}), 0)` })
    .from(assets)
    .groupBy(assets.status);

  const byOffice = await db
    .select({
      name: offices.name,
      type: offices.type,
      n: count(),
      value: sql<string>`coalesce(sum(${assets.unitCost}), 0)`,
    })
    .from(assets)
    .leftJoin(offices, eq(assets.officeId, offices.id))
    .groupBy(offices.name, offices.type)
    .orderBy(offices.name);

  const disposalByStatus = await db
    .select({ status: disposalRequests.status, n: count() })
    .from(disposalRequests)
    .groupBy(disposalRequests.status);

  const procurementByStatus = await db
    .select({ status: procurementRequests.status, n: count() })
    .from(procurementRequests)
    .groupBy(procurementRequests.status);

  const latestProcurements = await db
    .select()
    .from(procurementRequests)
    .orderBy(desc(procurementRequests.createdAt))
    .limit(8);

  return (
    <div className="space-y-6">
      <PrintLetterhead title="PSMO Digest Report" />

      <div className="print:hidden">
        <PageHeader
          kicker="Reports"
          title="PSMO digest"
          description="Snapshot of stock, disposal, and procurement for Ma'am Mitch and PSMO staff. Print this page for a paper copy."
          actions={<PrintButton />}
        />
      </div>

      <section className="rounded-2xl border border-[#e4dccb] bg-white p-5 print:border-0">
        <h2 className="font-display text-2xl">Inventory by status</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#eee6d6]">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
              <tr>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Count</th>
                <th className="px-4 py-2 text-right">Book value</th>
              </tr>
            </thead>
            <tbody>
              {byStatus.map((row) => (
                <tr key={row.status} className="border-t border-[#eee6d6]">
                  <td className="px-4 py-2">
                    <StatusBadge value={row.status} />
                  </td>
                  <td className="px-4 py-2">{row.n}</td>
                  <td className="px-4 py-2 text-right">{peso(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
        <h2 className="font-display text-2xl">Holdings by office / laboratory</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#eee6d6]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
              <tr>
                <th className="px-4 py-2">Unit</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Items</th>
                <th className="px-4 py-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {byOffice.map((row) => (
                <tr key={`${row.name}-${row.type}`} className="border-t border-[#eee6d6]">
                  <td className="px-4 py-2">{row.name ?? "Unassigned"}</td>
                  <td className="px-4 py-2 capitalize">{row.type ?? "—"}</td>
                  <td className="px-4 py-2">{row.n}</td>
                  <td className="px-4 py-2 text-right">{peso(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
          <h2 className="font-display text-2xl">Disposal pipeline</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#eee6d6]">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
                <tr>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {disposalByStatus.map((row) => (
                  <tr key={row.status} className="border-t border-[#eee6d6]">
                    <td className="px-4 py-2">
                      <StatusBadge value={row.status} />
                    </td>
                    <td className="px-4 py-2 text-right">{row.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
          <h2 className="font-display text-2xl">Procurement pipeline</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-[#eee6d6]">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
                <tr>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {procurementByStatus.map((row) => (
                  <tr key={row.status} className="border-t border-[#eee6d6]">
                    <td className="px-4 py-2">
                      <StatusBadge value={row.status} />
                    </td>
                    <td className="px-4 py-2 text-right">{row.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
        <h2 className="font-display text-2xl">Recent purchase orders / MRRs</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#eee6d6]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
              <tr>
                <th className="px-4 py-2">Request</th>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Control / MRR</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {latestProcurements.map((row) => (
                <tr key={row.id} className="border-t border-[#eee6d6]">
                  <td className="px-4 py-2">{row.requestNo}</td>
                  <td className="px-4 py-2">{row.itemName}</td>
                  <td className="px-4 py-2">
                    {row.controlNo ?? "—"}
                    {row.mrrNo ? <span className="block text-xs">{row.mrrNo}</span> : null}
                  </td>
                  <td className="px-4 py-2">{formatDate(row.requestDate)}</td>
                  <td className="px-4 py-2">
                    <StatusBadge value={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
