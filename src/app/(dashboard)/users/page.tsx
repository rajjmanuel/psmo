import { count, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AddUserModal, EditUserModal } from "@/components/CrudModals";
import { PageHeader } from "@/components/PageHeader";
import { getSessionUser } from "@/lib/auth-server";
import { formatDate } from "@/lib/format";
import { seedUsersIfEmpty } from "@/lib/seed";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  admin: "PSMO Admin",
  staff: "PSMO Staff",
  amt: "AMT Officer",
  ssmt: "SSMT Officer",
  accounting: "Accounting",
};

const ROLE_TONE: Record<string, string> = {
  admin: "bg-violet-50 text-violet-700 ring-violet-200",
  staff: "bg-blue-50 text-blue-700 ring-blue-200",
  amt: "bg-amber-50 text-amber-800 ring-amber-200",
  ssmt: "bg-teal-50 text-teal-700 ring-teal-200",
  accounting: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export default async function UsersPage() {
  const sessionUser = await getSessionUser();

  // Access control: only PSMO Admin may open user management.
  if (!sessionUser || sessionUser.role !== "admin") {
    return (
      <div>
        <PageHeader
          kicker="User Management"
          title="Restricted area"
          description="Only a PSMO Admin can manage staff accounts."
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
          <p className="font-display text-2xl text-amber-900">Admin access required</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-amber-800">
            Your account is signed in as{" "}
            <span className="font-semibold">
              {ROLE_LABELS[sessionUser?.role ?? ""] ?? "Staff"}
            </span>
            . Please coordinate with Ma&apos;am Mitch or the PSMO Admin to request an account or a
            role change.
          </p>
        </div>
      </div>
    );
  }

  await seedUsersIfEmpty();

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const [counts] = await db
    .select({
      total: count(),
      active: sql<number>`coalesce(sum(case when ${users.active} then 1 else 0 end), 0)`,
      admins: sql<number>`coalesce(sum(case when ${users.role} = 'admin' then 1 else 0 end), 0)`,
    })
    .from(users);

  return (
    <div>
      <PageHeader
        kicker="User Management"
        title="Staff accounts"
        description="Accounts are created by the PSMO Admin only — there is no public sign-up. This keeps the official ledger secure and every activity log traceable to a real employee."
        actions={<AddUserModal label="Add account" />}
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total accounts" value={String(counts.total)} detail="Registered staff" />
        <Stat label="Active" value={String(counts.active)} detail="Can sign in" />
        <Stat
          label="Deactivated"
          value={String(counts.total - counts.active)}
          detail="Blocked from sign-in"
        />
        <Stat label="Administrators" value={String(counts.admins)} detail="Full system access" />
      </section>

      <div className="overflow-x-auto rounded-2xl border border-[#e4dccb] bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
            <tr>
              <th className="px-4 py-3">Staff name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date added</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#eee6d6] hover:bg-[#fbf7ef]">
                <td className="px-4 py-3">
                  <span className="font-medium text-[var(--ink)]">{row.name}</span>
                  {row.id === sessionUser.id ? (
                    <span className="ml-2 text-[11px] font-semibold text-[var(--primary)]">
                      (You)
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-[#5c564c]">{row.username}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                      ROLE_TONE[row.role] ?? "bg-slate-100 text-slate-700 ring-slate-200"
                    }`}
                  >
                    {ROLE_LABELS[row.role] ?? row.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Deactivated
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-[#6b6254]">
                  {formatDate(row.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end">
                    <EditUserModal
                      user={{
                        id: row.id,
                        username: row.username,
                        name: row.name,
                        role: row.role,
                        active: row.active,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 rounded-2xl border border-[#e4dccb] bg-[var(--surface-soft)] px-4 py-3 text-[13px] text-[#5c564c]">
        <span className="font-semibold text-[var(--ink)]">Note:</span> Accounts are never deleted —
        they are deactivated instead. This preserves the audit trail so past records still show who
        encoded or approved them.
      </p>
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
