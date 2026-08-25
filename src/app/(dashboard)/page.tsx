import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activityLogs,
  assets,
  disposalRequests,
  offices,
  procurementRequests,
} from "@/db/schema";
import { BrandModuleCards, HomeHero } from "@/components/HomeHero";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime, peso } from "@/lib/format";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await seedIfEmpty();

  const officeRows = await db.select().from(offices).orderBy(offices.name);

  const [assetCount] = await db.select({ n: count() }).from(assets);
  const [serviceable] = await db
    .select({ n: count() })
    .from(assets)
    .where(eq(assets.status, "serviceable"));
  const [forDisposal] = await db
    .select({ n: count() })
    .from(assets)
    .where(eq(assets.status, "for-disposal"));
  const [valueRow] = await db
    .select({ total: sql<string>`coalesce(sum(${assets.unitCost}), 0)` })
    .from(assets);
  const [openDisposals] = await db
    .select({ n: count() })
    .from(disposalRequests)
    .where(sql`${disposalRequests.status} not in ('disposed', 'rejected')`);
  const [openProcurements] = await db
    .select({ n: count() })
    .from(procurementRequests)
    .where(sql`${procurementRequests.status} not in ('completed', 'rejected')`);

  const recentAssets = await db
    .select({
      id: assets.id,
      taggingNo: assets.taggingNo,
      description: assets.description,
      status: assets.status,
      officeName: offices.name,
    })
    .from(assets)
    .leftJoin(offices, eq(assets.officeId, offices.id))
    .orderBy(desc(assets.createdAt))
    .limit(5);

  const recentLogs = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(6);

  const liveDisposals = await db
    .select({
      id: disposalRequests.id,
      requestNo: disposalRequests.requestNo,
      status: disposalRequests.status,
      officeName: offices.name,
    })
    .from(disposalRequests)
    .leftJoin(offices, eq(disposalRequests.officeId, offices.id))
    .orderBy(desc(disposalRequests.createdAt))
    .limit(4);

  const liveProcurements = await db
    .select({
      id: procurementRequests.id,
      requestNo: procurementRequests.requestNo,
      itemName: procurementRequests.itemName,
      status: procurementRequests.status,
      unit: procurementRequests.unit,
    })
    .from(procurementRequests)
    .orderBy(desc(procurementRequests.createdAt))
    .limit(4);

  return (
    <div className="space-y-8">
      <HomeHero offices={officeRows} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Tagged property" value={String(assetCount.n)} detail="Offices & laboratories" />
        <Stat label="Serviceable" value={String(serviceable.n)} detail="Ready for use" />
        <Stat label="Book value" value={peso(valueRow.total)} detail="Recorded unit cost" compact />
        <Stat
          label="Open disposals"
          value={String(openDisposals.n)}
          detail={`${forDisposal.n} tagged for disposal`}
        />
        <Stat
          label="Live procurements"
          value={String(openProcurements.n)}
          detail="AMT & SSMT pipeline"
        />
      </section>

      <BrandModuleCards />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-[var(--ink)]">Recent stock</h2>
            <Link href="/inventory" className="text-sm underline">
              Open ledger
            </Link>
          </div>
          <ul className="divide-y divide-[var(--line)]">
            {recentAssets.map((asset) => (
              <li key={asset.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/inventory/${asset.id}`} className="font-medium hover:underline">
                    {asset.taggingNo}
                  </Link>
                  <p className="text-sm text-[var(--muted)]">
                    {asset.description} · {asset.officeName ?? "Unassigned"}
                  </p>
                </div>
                <StatusBadge value={asset.status} />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-display mb-4 text-2xl text-[var(--ink)]">Activity tape</h2>
          <ul className="space-y-3">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex gap-3 text-sm">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
                <div>
                  <p className="text-[var(--ink)]">{log.details}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {log.actor} · {formatDateTime(log.createdAt)} · {log.module}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MiniList
          title="Disposal queue"
          href="/disposal"
          rows={liveDisposals.map((d) => ({
            href: `/disposal/${d.id}`,
            title: d.requestNo,
            meta: d.officeName ?? "—",
            status: d.status,
          }))}
        />
        <MiniList
          title="Procurement pipeline"
          href="/procurement"
          rows={liveProcurements.map((p) => ({
            href: `/procurement/${p.id}`,
            title: p.requestNo,
            meta: `${p.unit} · ${p.itemName}`,
            status: p.status,
          }))}
        />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
  compact = false,
}: {
  label: string;
  value: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--line)] bg-white px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)]">{label}</p>
      <p className={`font-display mt-1 min-w-0 max-w-full overflow-hidden break-all text-[var(--ink)] ${compact ? "text-xl leading-tight sm:text-2xl" : "text-3xl"}`}>
        {value}
      </p>
      <p className="text-xs text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function MiniList({
  title,
  href,
  rows,
}: {
  title: string;
  href: string;
  rows: { href: string; title: string; meta: string; status: string }[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl text-[var(--ink)]">{title}</h2>
        <Link href={href} className="text-sm underline">
          View all
        </Link>
      </div>
      <ul className="divide-y divide-[var(--line)]">
        {rows.map((row) => (
          <li key={row.href} className="flex items-center justify-between gap-3 py-3">
            <div>
              <Link href={row.href} className="font-medium hover:underline">
                {row.title}
              </Link>
              <p className="text-sm text-[var(--muted)]">{row.meta}</p>
            </div>
            <StatusBadge value={row.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
