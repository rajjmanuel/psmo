"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { authFetch } from "@/lib/auth-fetch";
import { ModalTrigger } from "@/components/Modal";

const ACTION_MESSAGES: Record<string, { title: string; message: string }> = {
  endorse: {
    title: "Endorsement recorded",
    message: "Excel & IOM endorsement saved for this disposal request.",
  },
  verify: {
    title: "Verification completed",
    message: "Under warranty / beyond repair status has been recorded.",
  },
  approve: {
    title: "Disposal approved",
    message: "Request approved for final disposal.",
  },
  resume: {
    title: "Disposal request resumed",
    message: "The request returned to the step where it was rejected.",
  },
  dispose: {
    title: "Items marked disposed",
    message: "Tagged assets are now disposed on the ledger.",
  },
  reject: {
    title: "Disposal request rejected",
    message: "Request returned to the office / laboratory.",
  },
};

const DISPOSAL_STEPS = [
  { value: "requested", label: "File request" },
  { value: "endorsed", label: "Record endorsement" },
  { value: "verified", label: "Complete verification" },
  { value: "approved", label: "Approve for disposal" },
  { value: "disposed", label: "Mark items disposed" },
] as const;

export function DisposalActions({
  id,
  status,
  rejectedFromStatus,
}: {
  id: number;
  status: string;
  rejectedFromStatus?: string | null;
}) {
  const router = useRouter();
  const { name: actorName } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [endorsementType, setEndorsementType] = useState("both");
  const [endorsementRef, setEndorsementRef] = useState("");
  const [verification, setVerification] = useState("beyond-repair");

  async function run(action: string, extra: Record<string, string> = {}) {
    setBusy(true);
    try {
      const res = await authFetch(`/api/disposals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, actor: actorName, ...extra }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error("Transaction failed", data.error ?? `Unable to process ${action}.`);
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { status?: string };
      const msg = ACTION_MESSAGES[action] ?? {
        title: "Disposal updated",
        message: "The disposal request has been updated.",
      };
      const nextStatus =
        action === "resume"
          ? data.status ?? rejectedFromStatus ?? "requested"
          : data.status;
      if (nextStatus) setCurrentStatus(nextStatus);
      toast.success(msg.title, msg.message);
      if (action === "reject" || action === "dispose") {
        router.push("/disposal");
        return;
      }
      router.refresh();
    } catch {
      toast.error("Transaction failed", "The request could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (currentStatus === "disposed") return null;

  const processStatus =
    currentStatus === "rejected" ? rejectedFromStatus ?? "requested" : currentStatus;

  return (
    <ModalTrigger
      label="Process transaction"
      title="Advance disposal transaction"
      description="Record endorsement, verification, approval, or final disposal for this request."
    >
      <div className="space-y-4 rounded-2xl border border-[#e4dccb] bg-white p-5">
        <h2 className="font-display text-xl">Advance the process</h2>

        <ol className="grid gap-2 sm:grid-cols-5">
          {DISPOSAL_STEPS.map((step, index) => {
            const stepIndex = DISPOSAL_STEPS.findIndex((item) => item.value === processStatus);
            const active = step.value === processStatus;
            const done = stepIndex > index || processStatus === "disposed";
            return (
              <li
                key={step.value}
                className={`rounded-xl border px-2 py-2 ${
                  active
                    ? "border-[#c4a35a] bg-[#f7efd8]"
                    : done
                      ? "border-[#c9d9cf] bg-[#eef4ef]"
                      : "border-[#e4dccb] bg-white"
                }`}
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a7540]">
                  Step {index + 1}
                </p>
                <p className="text-xs font-medium text-[#10231c]">{step.label}</p>
              </li>
            );
          })}
        </ol>

        {currentStatus === "requested" ? (
          <div className="grid gap-3">
            <p className="text-sm text-[#5c564c]">
              Endorsement thru Excel &amp; IOM from the requesting office/lab.
            </p>
            <select
              value={endorsementType}
              onChange={(e) => setEndorsementType(e.target.value)}
              className="field"
            >
              <option value="excel">Excel listing</option>
              <option value="iom">Inter-Office Memorandum</option>
              <option value="both">Excel &amp; IOM</option>
            </select>
            <input
              value={endorsementRef}
              onChange={(e) => setEndorsementRef(e.target.value)}
              className="field"
              placeholder="IOM / Excel reference no."
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => run("endorse", { endorsementType, endorsementRef })}
              className="btn-primary"
            >
              Record endorsement
            </button>
          </div>
        ) : null}

        {currentStatus === "endorsed" ? (
          <div className="grid gap-3">
            <p className="text-sm text-[#5c564c]">
              Verification: still under warranty, or already beyond repair?
            </p>
            <select
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
              className="field"
            >
              <option value="under-warranty">Under Warranty</option>
              <option value="beyond-repair">Beyond Repair</option>
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={() => run("verify", { verification })}
              className="btn-primary"
            >
              Complete verification
            </button>
          </div>
        ) : null}

        {currentStatus === "verified" || currentStatus === "rejected" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(currentStatus === "rejected" ? "resume" : "approve")}
            className="btn-primary"
          >
            {currentStatus === "rejected"
              ? `Continue from ${rejectedFromStatus ?? "requested"}`
              : "Approve for disposal"}
          </button>
        ) : null}

        {currentStatus === "approved" ? (
          <button type="button" disabled={busy} onClick={() => run("dispose")} className="btn-primary">
            Mark items disposed
          </button>
        ) : null}

        {currentStatus !== "rejected" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => run("reject", { remarks: "Returned to requesting unit." })}
            className="btn-ghost"
          >
            Reject request
          </button>
        ) : null}
      </div>
    </ModalTrigger>
  );
}
