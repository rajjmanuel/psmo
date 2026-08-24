import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { assets, disposalItems, disposalRequests, offices } from "@/db/schema";
import { DisposalActions } from "@/components/DisposalActions";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { DISPOSAL_STATUSES } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DisposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db
    .select({
      id: disposalRequests.id,
      requestNo: disposalRequests.requestNo,
      requestedBy: disposalRequests.requestedBy,
      requestDate: disposalRequests.requestDate,
      status: disposalRequests.status,
      endorsementType: disposalRequests.endorsementType,
      endorsementRef: disposalRequests.endorsementRef,
      endorsedBy: disposalRequests.endorsedBy,
      endorsedAt: disposalRequests.endorsedAt,
      verification: disposalRequests.verification,
      verifiedBy: disposalRequests.verifiedBy,
      verifiedAt: disposalRequests.verifiedAt,
      approvedBy: disposalRequests.approvedBy,
      approvedAt: disposalRequests.approvedAt,
      reason: disposalRequests.reason,
      remarks: disposalRequests.remarks,
      officeName: offices.name,
      officeType: offices.type,
    })
    .from(disposalRequests)
    .leftJoin(offices, eq(disposalRequests.officeId, offices.id))
    .where(eq(disposalRequests.id, Number(id)))
    .limit(1);

  if (!row) notFound();

  const items = await db
    .select({
      id: disposalItems.id,
      reason: disposalItems.reason,
      condition: disposalItems.condition,
      assetId: assets.id,
      taggingNo: assets.taggingNo,
      description: assets.description,
      brand: assets.brand,
      model: assets.model,
      serialNo: assets.serialNo,
      status: assets.status,
    })
    .from(disposalItems)
    .innerJoin(assets, eq(disposalItems.assetId, assets.id))
    .where(eq(disposalItems.disposalRequestId, row.id));

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="For Disposal"
        title={row.requestNo}
        description={`${row.officeName ?? "Requesting unit"} · filed by ${row.requestedBy} on ${formatDate(row.requestDate)}`}
        actions={
          <Link href="/disposal" className="btn-ghost">
            All requests
          </Link>
        }
      />

      <WorkflowStepper steps={DISPOSAL_STATUSES.filter((s) => s.value !== "rejected")} current={row.status} />

      <div className="space-y-4">
        <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Request narrative</h2>
              <StatusBadge value={row.status} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#3d4f45]">{row.reason}</p>
            {row.remarks ? <p className="mt-2 text-sm text-[#6b6254]">{row.remarks}</p> : null}
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[#8a8070]">Endorsement</dt>
                <dd className="capitalize">
                  {row.endorsementType?.replace("both", "Excel & IOM") ?? "Pending"}
                </dd>
                <dd className="text-xs text-[#8a8070]">{row.endorsementRef ?? ""}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[#8a8070]">Verification</dt>
                <dd className="capitalize">{row.verification?.replace("-", " ") ?? "Pending"}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[#8a8070]">Endorsed</dt>
                <dd>
                  {row.endorsedBy ?? "—"}
                  <span className="block text-xs text-[#8a8070]">{formatDateTime(row.endorsedAt)}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-[#8a8070]">Verified</dt>
                <dd>
                  {row.verifiedBy ?? "—"}
                  <span className="block text-xs text-[#8a8070]">{formatDateTime(row.verifiedAt)}</span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e4dccb] bg-white">
            <div className="border-b border-[#eee6d6] px-5 py-3">
              <h2 className="font-display text-xl">Tagged items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
                <tr>
                  <th className="px-4 py-2">Tagging No.</th>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">S/N</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-[#eee6d6]">
                    <td className="px-4 py-2">
                      <Link href={`/inventory/${item.assetId}`} className="hover:underline">
                        {item.taggingNo}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {item.description}
                      <span className="block text-xs text-[#8a8070]">
                        {[item.brand, item.model].filter(Boolean).join(" ")}
                      </span>
                    </td>
                    <td className="px-4 py-2">{item.serialNo ?? "—"}</td>
                    <td className="px-4 py-2">
                      <StatusBadge value={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </section>

        <div className="flex justify-end">
          <DisposalActions id={row.id} status={row.status} />
        </div>
      </div>
    </div>
  );
}
