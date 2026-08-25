import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { canvassQuotes, offices, procurementAttachments, procurementRequests } from "@/db/schema";
import { PageHeader } from "@/components/PageHeader";
import { ProcurementActions } from "@/components/ProcurementActions";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { PROCUREMENT_STATUSES } from "@/lib/constants";
import { formatDate, formatDateTime, peso } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProcurementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db
    .select({
      id: procurementRequests.id,
      requestNo: procurementRequests.requestNo,
      unit: procurementRequests.unit,
      requestedBy: procurementRequests.requestedBy,
      requestDate: procurementRequests.requestDate,
      itemName: procurementRequests.itemName,
      specifications: procurementRequests.specifications,
      quantity: procurementRequests.quantity,
      estimatedCost: procurementRequests.estimatedCost,
      justification: procurementRequests.justification,
      status: procurementRequests.status,
      comparativeNotes: procurementRequests.comparativeNotes,
      approvalNotes: procurementRequests.approvalNotes,
      approvedBy: procurementRequests.approvedBy,
      approvedAt: procurementRequests.approvedAt,
      controlNo: procurementRequests.controlNo,
      poDate: procurementRequests.poDate,
      paymentRef: procurementRequests.paymentRef,
      paymentDate: procurementRequests.paymentDate,
      mrrNo: procurementRequests.mrrNo,
      mrrDate: procurementRequests.mrrDate,
      mrrFrom: procurementRequests.mrrFrom,
      supplier: procurementRequests.supplier,
      remarks: procurementRequests.remarks,
      officeName: offices.name,
    })
    .from(procurementRequests)
    .leftJoin(offices, eq(procurementRequests.officeId, offices.id))
    .where(eq(procurementRequests.id, Number(id)))
    .limit(1);

  if (!row) notFound();

  const quotes = await db
    .select()
    .from(canvassQuotes)
    .where(eq(canvassQuotes.procurementRequestId, row.id));
  const attachments = await db
    .select({ id: procurementAttachments.id, fileName: procurementAttachments.fileName, mimeType: procurementAttachments.mimeType })
    .from(procurementAttachments)
    .where(eq(procurementAttachments.procurementRequestId, row.id));

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={`${row.unit} procurement`}
        title={row.requestNo}
        description={`${row.itemName} · requested by ${row.requestedBy} on ${formatDate(row.requestDate)}`}
        actions={
          <Link href="/procurement" className="btn-ghost">
            All requests
          </Link>
        }
      />

      <WorkflowStepper
        steps={PROCUREMENT_STATUSES.filter((s) => s.value !== "rejected")}
        current={row.status}
      />

      <div className="space-y-4">
        <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">{row.itemName}</h2>
              <StatusBadge value={row.status} />
            </div>
            <p className="mt-2 text-sm text-[#5c564c]">{row.specifications}</p>
            {row.justification ? (
              <p className="mt-3 text-sm">
                <span className="font-medium">Justification. </span>
                {row.justification}
              </p>
            ) : null}

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Meta label="End-user" value={row.officeName ?? row.unit} />
              <Meta label="Quantity" value={String(row.quantity)} />
              <Meta label="Estimated cost" value={peso(row.estimatedCost)} />
              <Meta label="Winning supplier" value={row.supplier ?? "—"} />
              <Meta label="P.O. control no." value={row.controlNo ?? "Pending"} />
              <Meta label="P.O. date" value={formatDate(row.poDate)} />
              <Meta label="Check payment" value={row.paymentRef ?? "—"} />
              <Meta label="Payment date" value={formatDate(row.paymentDate)} />
              <Meta label="MRR no." value={row.mrrNo ?? "Pending"} />
              <Meta
                label="MRR"
                value={row.mrrNo ? `${row.mrrFrom ?? "Accounting"} · ${formatDate(row.mrrDate)}` : "—"}
              />
            </dl>

            {row.comparativeNotes ? (
              <div className="mt-4 rounded-xl bg-[#f7f1e6] px-4 py-3 text-sm">
                <p className="text-[11px] uppercase tracking-wider text-[#8a7540]">
                  Comparative report
                </p>
                <p className="mt-1">{row.comparativeNotes}</p>
              </div>
            ) : null}
            {row.approvalNotes ? (
              <div className="mt-3 text-sm text-[#5c564c]">
                Approved by {row.approvedBy} · {formatDateTime(row.approvedAt)} — {row.approvalNotes}
              </div>
            ) : null}
            {attachments.length > 0 ? (
              <div className="mt-4 rounded-xl bg-[#f7f1e6] px-4 py-3 text-sm">
                <p className="text-[11px] uppercase tracking-wider text-[#8a7540]">Supporting files</p>
                <div className="mt-2 grid gap-2">
                  {attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={`/api/procurements/${row.id}/attachments/${attachment.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {attachment.fileName}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {quotes.length > 0 ? (
            <section className="overflow-hidden rounded-2xl border border-[#e4dccb] bg-white">
              <div className="border-b border-[#eee6d6] px-5 py-3">
                <h2 className="font-display text-xl">Canvass quotations</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
                  <tr>
                    <th className="px-4 py-2">Supplier</th>
                    <th className="px-4 py-2">Quote</th>
                    <th className="px-4 py-2">Terms</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id} className="border-t border-[#eee6d6]">
                      <td className="px-4 py-2">
                        {q.supplier}
                        {q.selected ? (
                          <span className="ml-2 text-[11px] text-emerald-700">Lowest complying</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2">{peso(q.quotedPrice)}</td>
                      <td className="px-4 py-2">{q.terms ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </section>
          ) : null}

        <div className="flex justify-end">
          <ProcurementActions id={row.id} status={row.status} quotes={quotes} />
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-[#8a8070]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
