import Link from "next/link";
import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { assets, offices } from "@/db/schema";
import { EditItemModal, RecordItemModal } from "@/components/CrudModals";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ASSET_STATUSES } from "@/lib/constants";
import { formatDate, peso } from "@/lib/format";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string; officeId?: string }>;
}) {
  await seedIfEmpty();
  const params = await searchParams;
  const officeRows = await db.select().from(offices).orderBy(offices.name);

  const filters = [];
  if (params.q) {
    filters.push(
      or(
        like(assets.taggingNo, `%${params.q}%`),
        like(assets.description, `%${params.q}%`),
        like(assets.brand, `%${params.q}%`),
        like(assets.serialNo, `%${params.q}%`),
      ),
    );
  }
  if (params.status) filters.push(eq(assets.status, params.status));
  if (params.source) filters.push(eq(assets.source, params.source));
  if (params.officeId) filters.push(eq(assets.officeId, Number(params.officeId)));

  const rows = await db
    .select({
      id: assets.id,
      taggingNo: assets.taggingNo,
      description: assets.description,
      brand: assets.brand,
      model: assets.model,
      serialNo: assets.serialNo,
      partsNo: assets.partsNo,
      dateOfPurchase: assets.dateOfPurchase,
      status: assets.status,
      source: assets.source,
      unitCost: assets.unitCost,
      officeId: assets.officeId,
      locationNote: assets.locationNote,
      category: assets.category,
      condition: assets.condition,
      remarks: assets.remarks,
      officeName: offices.name,
      officeCode: offices.code,
    })
    .from(assets)
    .leftJoin(offices, eq(assets.officeId, offices.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(assets.createdAt));

  return (
    <div>
      <PageHeader
        kicker="Inventory for Stock"
        title="Property ledger"
        description="Recording of item or equipment from Offices (All System) and all Laboratory — tagging no., brand, model, S/N, parts no., DOP, location, status."
        actions={<RecordItemModal offices={officeRows} label="Record item" />}
      />

      <form className="mb-5 grid gap-2 rounded-2xl border border-[#e4dccb] bg-white p-3 md:grid-cols-5">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search tag, brand, S/N…"
          className="field md:col-span-2"
        />
        <select name="status" defaultValue={params.status ?? ""} className="field">
          <option value="">All statuses</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select name="source" defaultValue={params.source ?? ""} className="field">
          <option value="">All sources</option>
          <option value="office">Offices</option>
          <option value="laboratory">Laboratory</option>
        </select>
        <select name="officeId" defaultValue={params.officeId ?? ""} className="field">
          <option value="">All locations</option>
          {officeRows.map((o) => (
            <option key={o.id} value={o.id}>
              {o.code}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2 md:col-span-5">
          <button className="btn-ghost w-fit">Apply filters</button>
          <Link href="/inventory" className="btn-ghost w-fit">
            Reset
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title="No property matches"
          body="Adjust the filters or use the Record item button above to encode a new office or laboratory property."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#e4dccb] bg-white">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
              <tr>
                <th className="px-4 py-3">Tagging No.</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Brand / Model</th>
                <th className="px-4 py-3">S/N</th>
                <th className="px-4 py-3">DOP</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#eee6d6] hover:bg-[#fbf7ef]">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/inventory/${row.id}`} className="hover:underline">
                      {row.taggingNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{row.description}</div>
                    <div className="text-xs text-[#8a8070]">{row.partsNo ?? "No parts no."}</div>
                  </td>
                  <td className="px-4 py-3">
                    {[row.brand, row.model].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3">{row.serialNo ?? "—"}</td>
                  <td className="px-4 py-3">{formatDate(row.dateOfPurchase)}</td>
                  <td className="px-4 py-3">
                    {row.officeCode ?? "—"}
                    <span className="block text-xs capitalize text-[#8a8070]">{row.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={row.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{peso(row.unitCost)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <EditItemModal
                        offices={officeRows}
                        asset={{
                          id: row.id,
                          taggingNo: row.taggingNo,
                          description: row.description,
                          brand: row.brand,
                          model: row.model,
                          serialNo: row.serialNo,
                          partsNo: row.partsNo,
                          dateOfPurchase: row.dateOfPurchase,
                          officeId: row.officeId,
                          locationNote: row.locationNote,
                          status: row.status,
                          category: row.category,
                          unitCost: row.unitCost,
                          source: row.source,
                          condition: row.condition,
                          remarks: row.remarks,
                        }}
                      />
                    </div>
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
