"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { authFetch } from "@/lib/auth-fetch";
import { todayISO } from "@/lib/format";

type Office = { id: number; name: string; code: string };

export function ProcurementForm({
  offices,
  onSuccess,
}: {
  offices: Office[];
  onSuccess?: (id: number) => void;
}) {
  const router = useRouter();
  const { name: actorName } = useAuth();
  const toast = useToast();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(formData: FormData) {
    setSaving(true);
    setError("");
    const res = await authFetch("/api/procurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit: String(formData.get("unit") ?? "AMT"),
        officeId: formData.get("officeId") ? Number(formData.get("officeId")) : null,
        requestedBy: String(formData.get("requestedBy") ?? ""),
        requestDate: String(formData.get("requestDate") ?? todayISO()),
        itemName: String(formData.get("itemName") ?? ""),
        specifications: String(formData.get("specifications") ?? ""),
        quantity: Number(formData.get("quantity") ?? 1),
        estimatedCost: String(formData.get("estimatedCost") ?? ""),
        justification: String(formData.get("justification") ?? ""),
        actor: actorName,
      }),
    });
    const data = (await res.json()) as {
      id?: number;
      error?: string;
      requestNo?: string;
      itemName?: string;
    };
    setSaving(false);
    if (!res.ok) {
      toast.error("Unable to file procurement request", data.error ?? "Please review the form and try again.");
      setError(data.error ?? "Unable to file request.");
      return;
    }
    toast.success(
      "Procurement request filed",
      `${data.requestNo ?? "New request"} for ${data.itemName ?? "requested item"} is ready for canvassing.`,
    );
    router.refresh();
    if (data.id && onSuccess) {
      onSuccess(data.id);
    } else {
      router.push(`/procurement/${data.id}`);
    }
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
        <h2 className="font-display text-xl">Request of AMT / SSMT</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Requesting unit</span>
            <select name="unit" className="field">
              <option value="AMT">AMT — Administrative Management Team</option>
              <option value="SSMT">SSMT — Support Services Management Team</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">End-user office / lab</span>
            <select name="officeId" className="field">
              <option value="">Optional</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} — {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Requested by</span>
            <input name="requestedBy" required className="field" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Request date</span>
            <input type="date" name="requestDate" defaultValue={todayISO()} className="field" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Item / equipment</span>
            <input name="itemName" required className="field" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Specifications</span>
            <textarea name="specifications" rows={3} className="field" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Quantity</span>
            <input name="quantity" type="number" min={1} defaultValue={1} className="field" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Estimated cost (PHP)</span>
            <input name="estimatedCost" type="number" step="0.01" className="field" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Justification</span>
            <textarea name="justification" rows={3} className="field" />
          </label>
        </div>
      </section>
      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
        {saving ? "Filing…" : "Submit procurement request"}
      </button>
    </form>
  );
}
