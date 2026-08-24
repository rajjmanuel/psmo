import Link from "next/link";
import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { formatDateTime } from "@/lib/format";
import { seedIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

const MODULE_LABELS: Record<string, string> = {
  inventory: "Inventory",
  disposal: "For Disposal",
  procurement: "For Procurement",
  offices: "Offices & Labs",
  settings: "Settings",
  auth: "Sign-in",
};

const MODULE_TONE: Record<string, string> = {
  inventory: "bg-blue-50 text-blue-700 ring-blue-200",
  disposal: "bg-amber-50 text-amber-800 ring-amber-200",
  procurement: "bg-violet-50 text-violet-700 ring-violet-200",
  offices: "bg-teal-50 text-teal-700 ring-teal-200",
  settings: "bg-slate-100 text-slate-700 ring-slate-200",
  auth: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

function prettyAction(action: string) {
  return action
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    module?: string;
    actor?: string;
    size?: string;
    page?: string;
  }>;
}) {
  await seedIfEmpty();
  const params = await searchParams;

  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.size))
    ? Number(params.size)
    : DEFAULT_PAGE_SIZE;
  const currentPage = Math.max(1, Number(params.page) || 1);
  const offset = (currentPage - 1) * pageSize;

  const filters = [];
  if (params.q) {
    filters.push(
      or(
        like(activityLogs.details, `%${params.q}%`),
        like(activityLogs.actor, `%${params.q}%`),
        like(activityLogs.action, `%${params.q}%`),
      ),
    );
  }
  if (params.module) filters.push(eq(activityLogs.module, params.module));
  if (params.actor) filters.push(eq(activityLogs.actor, params.actor));

  const whereClause = filters.length ? and(...filters) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(activityLogs)
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const safeOffset = (safePage - 1) * pageSize;

  const rows = await db
    .select()
    .from(activityLogs)
    .where(whereClause)
    .orderBy(desc(activityLogs.createdAt))
    .limit(pageSize)
    .offset(safeOffset);

  const actorRows = await db
    .select({ actor: activityLogs.actor, n: sql<number>`count(*)` })
    .from(activityLogs)
    .groupBy(activityLogs.actor)
    .orderBy(desc(sql`count(*)`));

  const moduleRows = await db
    .select({ module: activityLogs.module, n: sql<number>`count(*)` })
    .from(activityLogs)
    .groupBy(activityLogs.module);

  const [todayResult] = await db
    .select({ n: count() })
    .from(activityLogs)
    .where(sql`${activityLogs.createdAt} >= curdate()`);

  function buildHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.q) next.set("q", params.q);
    if (params.module) next.set("module", params.module);
    if (params.actor) next.set("actor", params.actor);
    next.set("size", String(pageSize));
    next.set("page", String(safePage));
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    });
    const qs = next.toString();
    return `/logs${qs ? `?${qs}` : ""}`;
  }

  const showingFrom = total === 0 ? 0 : safeOffset + 1;
  const showingTo = Math.min(safeOffset + rows.length, total);

  return (
    <div>
      <PageHeader
        kicker="Audit Trail"
        title="Activity logs"
        description="Complete record of who encoded, endorsed, verified, approved, or updated anything in the PSMO system."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total entries" value={String(total)} detail="Matching filters" />
        <Stat label="Logged today" value={String(todayResult.n)} detail="Transactions today" />
        <Stat label="Active users" value={String(actorRows.length)} detail="Staff with activity" />
        <Stat label="Modules tracked" value={String(moduleRows.length)} detail="System areas" />
      </section>

      <form className="mb-5 grid gap-2 rounded-2xl border border-[#e4dccb] bg-white p-3 md:grid-cols-5">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search details, action, or staff…"
          className="field md:col-span-2"
        />
        <select name="module" defaultValue={params.module ?? ""} className="field">
          <option value="">All modules</option>
          {Object.entries(MODULE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="actor" defaultValue={params.actor ?? ""} className="field">
          <option value="">All staff</option>
          {actorRows.map((a) => (
            <option key={a.actor} value={a.actor}>
              {a.actor} ({a.n})
            </option>
          ))}
        </select>
        <select name="size" defaultValue={String(pageSize)} className="field">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              Show {size} rows
            </option>
          ))}
        </select>
        {/* Reset page to 1 whenever filters change */}
        <input type="hidden" name="page" value="1" />
        <div className="flex flex-wrap gap-2 md:col-span-5">
          <button className="btn-ghost w-fit">Apply filters</button>
          <Link href="/logs" className="btn-ghost w-fit">
            Reset
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title="No activity found"
          body="Adjust the filters, or start recording items and processing transactions to build the audit trail."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-[#e4dccb] bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
                <tr>
                  <th className="px-4 py-3">Date &amp; time</th>
                  <th className="px-4 py-3">Staff</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[#eee6d6] hover:bg-[#fbf7ef]">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#6b6254]">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-medium text-[var(--ink)]">{row.actor}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                          MODULE_TONE[row.module] ?? "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {MODULE_LABELS[row.module] ?? row.module}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium">
                      {prettyAction(row.action)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#5c564c]">{row.details ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#e4dccb] bg-white px-4 py-3 text-sm sm:flex-row">
            <p className="text-[13px] text-[var(--muted)]">
              Showing <span className="font-semibold text-[var(--ink)]">{showingFrom}</span>–
              <span className="font-semibold text-[var(--ink)]">{showingTo}</span> of{" "}
              <span className="font-semibold text-[var(--ink)]">{total}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={buildHref({ page: "1" })}
                aria-disabled={safePage === 1}
                className={`btn-ghost !px-3 !py-1.5 !text-xs ${
                  safePage === 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                « First
              </Link>
              <Link
                href={buildHref({ page: String(Math.max(1, safePage - 1)) })}
                aria-disabled={safePage === 1}
                className={`btn-ghost !px-3 !py-1.5 !text-xs ${
                  safePage === 1 ? "pointer-events-none opacity-50" : ""
                }`}
              >
                ‹ Previous
              </Link>
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink)]">
                Page {safePage} / {totalPages}
              </span>
              <Link
                href={buildHref({ page: String(Math.min(totalPages, safePage + 1)) })}
                aria-disabled={safePage === totalPages}
                className={`btn-ghost !px-3 !py-1.5 !text-xs ${
                  safePage === totalPages ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Next ›
              </Link>
              <Link
                href={buildHref({ page: String(totalPages) })}
                aria-disabled={safePage === totalPages}
                className={`btn-ghost !px-3 !py-1.5 !text-xs ${
                  safePage === totalPages ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Last »
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-[#e4dccb] bg-white px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--primary)]">{label}</p>
      <p className="font-display mt-1 text-3xl text-[var(--ink)]">{value}</p>
      <p className="text-xs text-[#8a8070]">{detail}</p>
    </div>
  );
}
