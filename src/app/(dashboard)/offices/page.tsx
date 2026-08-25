import { count } from "drizzle-orm";
import { db } from "@/db";
import { assets, offices } from "@/db/schema";
import { OfficeForm } from "@/components/OfficeForm";
import { OfficeActions } from "@/components/OfficeActions";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function OfficesPage() {
  await seedIfEmpty();
  const rows = await db.select().from(offices).orderBy(offices.type, offices.name);
  const counts = await db
    .select({
      officeId: assets.officeId,
      n: count(),
    })
    .from(assets)
    .groupBy(assets.officeId);
  const countMap = Object.fromEntries(counts.map((c) => [c.officeId, Number(c.n)]));

  const officeList = rows.filter((r) => r.type === "office");
  const labs = rows.filter((r) => r.type === "laboratory");

  return (
    <div>
      <PageHeader
        kicker="Directory"
        title="Offices & laboratories"
        description="All System offices and laboratories that request stock recording, disposal, and procurement through PSMO."
        actions={<OfficeForm />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Column title="Offices (All System)" rows={officeList} countMap={countMap} />
        <Column title="Laboratories" rows={labs} countMap={countMap} />
      </div>
    </div>
  );
}

function Column({
  title,
  rows,
  countMap,
}: {
  title: string;
  rows: typeof offices.$inferSelect[];
  countMap: Record<string, number>;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl">{title}</h2>
      {rows.map((row) => (
        <article key={row.id} className="rounded-2xl border border-[#e4dccb] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8a7540]">{row.code}</p>
              <h3 className="font-display text-xl">{row.name}</h3>
            </div>
            <StatusBadge value={row.type} />
          </div>
          <p className="mt-2 text-sm text-[#5c564c]">
            Head: {row.head ?? "—"} · {row.floor ?? "Location TBA"} · {row.contact ?? "No local"}
          </p>
          <p className="mt-1 text-xs text-[#8a8070]">
            {countMap[row.id] ?? 0} tagged item(s) on the ledger
          </p>
          <div className="mt-3 flex justify-end">
            <OfficeActions id={row.id} name={row.name} />
          </div>
        </article>
      ))}
    </section>
  );
}
