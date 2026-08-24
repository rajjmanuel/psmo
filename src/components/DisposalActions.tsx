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
  dispose: {
    title: "Items marked disposed",
    message: "Tagged assets are now disposed on the ledger.",
  },
  reject: {
    title: "Disposal request rejected",
    message: "Request returned to the office / laboratory.",
  },
};

export function DisposalActions({
  id,
  status,
}: {
  id: number;
  status: string;
}) {
  const router = useRouter();
  const { name: actorName } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [endorsementType, setEndorsementType] = useState("both");
  const [endorsementRef, setEndorsementRef] = useState("");
  const [verification, setVerification] = useState("beyond-repair");

  async function run(action: string, extra: Record<string, string> = {}) {
    setBusy(true);
    const res = await authFetch(`/api/disposals/${id}`, {
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
      title: "Disposal updated",
      message: "The disposal request has been updated.",
    };
    toast.success(msg.title, msg.message);
    router.refresh();
  }

  if (["disposed", "rejected"].includes(status)) return null;

  return (
    <ModalTrigger
      label="Process transaction"
      title="Advance disposal transaction"
      description="Record endorsement, verification, approval, or final disposal for this request."
    >
      <div className="space-y-4 rounded-2xl border border-[#e4dccb] bg-white p-5">
        <h2 className="font-display text-xl">Advance the process</h2>

        {status === "requested" ? (
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
              disabled={busy}
              onClick={() => run("endorse", { endorsementType, endorsementRef })}
              className="btn-primary"
            >
              Record endorsement
            </button>
          </div>
        ) : null}

        {status === "endorsed" ? (
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
              disabled={busy}
              onClick={() => run("verify", { verification })}
              className="btn-primary"
            >
              Complete verification
            </button>
          </div>
        ) : null}

        {status === "verified" ? (
          <button disabled={busy} onClick={() => run("approve")} className="btn-primary">
            Approve for disposal
          </button>
        ) : null}

        {status === "approved" ? (
          <button disabled={busy} onClick={() => run("dispose")} className="btn-primary">
            Mark items disposed
          </button>
        ) : null}

        <button
          disabled={busy}
          onClick={() => run("reject", { remarks: "Returned to requesting unit." })}
          className="btn-ghost"
        >
          Reject request
        </button>
      </div>
    </ModalTrigger>
  );
}
