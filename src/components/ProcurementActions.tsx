"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { authFetch } from "@/lib/auth-fetch";
import { ModalTrigger } from "@/components/Modal";
import { peso, todayISO } from "@/lib/format";

const ACTION_MESSAGES: Record<string, { title: string; message: string }> = {
  "start-canvass": {
    title: "Canvassing opened",
    message: "You can now encode supplier quotations.",
  },
  "add-quote": {
    title: "Quotation added",
    message: "Supplier quote saved for the comparative report.",
  },
  "select-quote": {
    title: "Supplier selected",
    message: "Lowest complying supplier marked for the comparative report.",
  },
  "submit-approval": {
    title: "Submitted for approval",
    message: "Comparative report sent for PSMO approval.",
  },
  approve: {
    title: "Procurement approved",
    message: "Request approved. You can now issue the P.O.",
  },
  "issue-po": {
    title: "Purchase Order issued",
    message: "P.O. with Control No. has been generated.",
  },
  "record-payment": {
    title: "Check payment recorded",
    message: "Payment reference saved after check release.",
  },
  "start-delivery": {
    title: "Out for delivery",
    message: "Purchase is now in the delivery process.",
  },
  "receive-mrr": {
    title: "MRR received",
    message: "Material Receiving Report recorded from Accounting to PSMO.",
  },
  complete: {
    title: "Procurement completed",
    message: "Request closed after successful MRR.",
  },
  reject: {
    title: "Procurement rejected",
    message: "Request returned to the requesting unit.",
  },
};

type Quote = {
  id: number;
  supplier: string;
  quotedPrice: string;
  terms: string | null;
  selected: boolean;
  notes: string | null;
};

export function ProcurementActions({
  id,
  status,
  quotes,
}: {
  id: number;
  status: string;
  quotes: Quote[];
}) {
  const router = useRouter();
  const { name: actorName } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [terms, setTerms] = useState("");
  const [comparativeNotes, setComparativeNotes] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [mrrFrom, setMrrFrom] = useState("Accounting");

  async function run(action: string, extra: Record<string, string | number> = {}) {
    setBusy(true);
    const res = await authFetch(`/api/procurements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, actor: actorName, ...extra }),
    });
    setBusy(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error("Transaction failed", data.error ?? `Unable to process ${action}.`);
      return;
    }

    const msg = ACTION_MESSAGES[action] ?? {
      title: "Procurement updated",
      message: "The procurement request has been updated.",
    };
    toast.success(msg.title, msg.message);
    router.refresh();
  }

  if (["completed", "rejected"].includes(status)) return null;

  return (
    <ModalTrigger
      label="Continue transaction"
      title="Continue procurement transaction"
      description="Process canvassing, comparative report, approval, P.O., check payment, delivery, and MRR."
    >
      <div className="space-y-5">
        {["requested", "canvassing"].includes(status) ? (
          <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
            <h2 className="font-display text-xl">Canvassing</h2>
            <p className="mb-3 text-sm text-[#5c564c]">
              Encode supplier quotations for the comparative report.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="field"
                placeholder="Supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
              <input
                className="field"
                placeholder="Quoted price"
                type="number"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
              />
              <input
                className="field"
                placeholder="Terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {status === "requested" ? (
                <button disabled={busy} onClick={() => run("start-canvass")} className="btn-ghost">
                  Open canvassing
                </button>
              ) : null}
              <button
                disabled={busy || !supplier || !quotedPrice}
                onClick={() => {
                  void run("add-quote", { supplier, quotedPrice, terms });
                  setSupplier("");
                  setQuotedPrice("");
                  setTerms("");
                }}
                className="btn-primary"
              >
                Add quotation
              </button>
            </div>
          </section>
        ) : null}

        {quotes.length > 0 && ["canvassing", "comparative"].includes(status) ? (
          <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
            <h2 className="font-display text-xl">Comparative report</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-[#eee6d6]">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
                  <tr>
                    <th className="px-3 py-2">Supplier</th>
                    <th className="px-3 py-2">Quote</th>
                    <th className="px-3 py-2">Terms</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.id} className="border-t border-[#eee6d6]">
                      <td className="px-3 py-2 font-medium">
                        {q.supplier}
                        {q.selected ? (
                          <span className="ml-2 text-[11px] text-emerald-700">Selected</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{peso(q.quotedPrice)}</td>
                      <td className="px-3 py-2">{q.terms ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          disabled={busy}
                          onClick={() =>
                            run("select-quote", {
                              quoteId: q.id,
                              comparativeNotes:
                                comparativeNotes || `Selected ${q.supplier} as lowest complying.`,
                            })
                          }
                          className="text-sm underline"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <textarea
              className="field mt-3"
              rows={2}
              placeholder="Comparative notes"
              value={comparativeNotes}
              onChange={(e) => setComparativeNotes(e.target.value)}
            />
            {status === "comparative" ? (
              <button
                disabled={busy}
                onClick={() => run("submit-approval", { comparativeNotes })}
                className="btn-primary mt-3"
              >
                Submit for approval
              </button>
            ) : null}
          </section>
        ) : null}

        {status === "for-approval" ? (
          <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
            <h2 className="font-display text-xl">Approval process</h2>
            <textarea
              className="field mt-3"
              rows={2}
              placeholder="Approval notes"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <button
                disabled={busy}
                onClick={() => run("approve", { approvalNotes })}
                className="btn-primary"
              >
                Approve
              </button>
              <button disabled={busy} onClick={() => run("reject")} className="btn-ghost">
                Reject
              </button>
            </div>
          </section>
        ) : null}

        {status === "approved" ? (
          <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
            <h2 className="font-display text-xl">Issue Purchase Order</h2>
            <p className="mb-3 text-sm text-[#5c564c]">
              P.O. with Control No. is issued by PSMO.
            </p>
            <button disabled={busy} onClick={() => run("issue-po")} className="btn-primary">
              Issue P.O. / assign control no.
            </button>
          </section>
        ) : null}

        {status === "po-issued" ? (
          <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
            <h2 className="font-display text-xl">After check payment</h2>
            <input
              className="field"
              placeholder="Check / payment reference"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
            />
            <button
              disabled={busy}
              onClick={() => run("record-payment", { paymentRef, paymentDate: todayISO() })}
              className="btn-primary mt-3"
            >
              Record check payment
            </button>
          </section>
        ) : null}

        {status === "payment" ? (
          <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
            <h2 className="font-display text-xl">Delivery process</h2>
            <button disabled={busy} onClick={() => run("start-delivery")} className="btn-primary">
              Mark out for delivery
            </button>
          </section>
        ) : null}

        {status === "delivery" ? (
          <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
            <h2 className="font-display text-xl">Material Receiving Report</h2>
            <p className="mb-3 text-sm text-[#5c564c]">
              MRR from Accounting to PSMO, with MRR No. issued by PSMO.
            </p>
            <input
              className="field"
              value={mrrFrom}
              onChange={(e) => setMrrFrom(e.target.value)}
              placeholder="Originating office"
            />
            <button
              disabled={busy}
              onClick={() => run("receive-mrr", { mrrFrom, mrrDate: todayISO() })}
              className="btn-primary mt-3"
            >
              Receive MRR
            </button>
          </section>
        ) : null}

        {status === "received" ? (
          <button disabled={busy} onClick={() => run("complete")} className="btn-primary">
            Close procurement as completed
          </button>
        ) : null}
      </div>
    </ModalTrigger>
  );
}
