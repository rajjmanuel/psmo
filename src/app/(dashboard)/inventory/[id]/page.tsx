import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { db } from "@/db";
import { assets, offices } from "@/db/schema";
import { AssetForm } from "@/components/AssetForm";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, peso } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(assets)
    .where(eq(assets.id, Number(id)))
    .limit(1);
  if (!row) notFound();

  const officeRows = await db.select().from(offices).orderBy(offices.name);
  const office = officeRows.find((o) => o.id === row.officeId);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Inventory for Stock"
        title={row.taggingNo}
        description={row.description}
        actions={
          <Link href="/inventory" className="btn-ghost">
            Back to ledger
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Status" value={<StatusBadge value={row.status} />} />
        <Fact label="Location" value={office ? `${office.code} · ${office.name}` : "Unassigned"} />
        <Fact label="Date of purchase" value={formatDate(row.dateOfPurchase)} />
        <Fact label="Unit cost" value={peso(row.unitCost)} />
      </div>

      <AssetForm
        offices={officeRows}
        initial={{
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
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e4dccb] bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a7540]">{label}</p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
