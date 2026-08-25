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
  units,
  onSuccess,
}: {
  offices: Office[];
  units: string[];
  onSuccess?: (id: number) => void;
}) {
  const router = useRouter();
  const { name: actorName } = useAuth();
  const toast = useToast();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [unit, setUnit] = useState(units[0] ?? "AMT");
  const [estimatedCost, setEstimatedCost] = useState("");

  function updateEstimatedCost(value: string) {
    const numeric = value.replace(/[^0-9.]/g, "");
    const [whole = "", decimal] = numeric.split(".");
    const formattedWhole = whole ? Number(whole).toLocaleString("en-US") : "";
    setEstimatedCost(
      `₱${formattedWhole}${decimal !== undefined ? `.${decimal.slice(0, 2)}` : ""}`,
    );
  }

  async function onSubmit(formData: FormData) {
    const requiredFields = [
      ["Requesting unit", unit],
      ["Requested by", String(formData.get("requestedBy") ?? "")],
      ["Request date", String(formData.get("requestDate") ?? "")],
      ["Item / equipment", String(formData.get("itemName") ?? "")],
      ["Specifications", String(formData.get("specifications") ?? "")],
      ["Justification", String(formData.get("justification") ?? "")],
    ] as const;
    const missingField = requiredFields.find(([, value]) => !value.trim());
    if (missingField || Number(formData.get("quantity") ?? 0) < 1) {
      const message = missingField
        ? `${missingField[0]} is required.`
        : "Quantity must be at least 1.";
      setError(message);
      toast.error("Incomplete procurement request", message);
      return;
    }

    setSaving(true);
    setError("");
    const res = await authFetch("/api/procurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit,
        officeId: formData.get("officeId") ? Number(formData.get("officeId")) : null,
        requestedBy: String(formData.get("requestedBy") ?? ""),
        requestDate: String(formData.get("requestDate") ?? todayISO()),
        itemName: String(formData.get("itemName") ?? ""),
        specifications: String(formData.get("specifications") ?? ""),
        quantity: Number(formData.get("quantity") ?? 1),
        estimatedCost: estimatedCost.replace(/[₱,]/g, ""),
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
    const attachments = formData
      .getAll("attachments")
      .filter((value): value is File => value instanceof File && value.size > 0);
    let attachmentWarning = "";
    for (const file of attachments) {
      const upload = new FormData();
      upload.append("file", file, file.name);
      const uploadResponse = await authFetch(`/api/procurements/${data.id}/attachments`, {
        method: "POST",
        body: upload,
      });
      if (!uploadResponse.ok) attachmentWarning = " Some attachments could not be uploaded.";
    }
    toast.success(
      "Procurement request filed",
      `${data.requestNo ?? "New request"} for ${data.itemName ?? "requested item"} is ready for canvassing.${attachmentWarning}`,
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
            <span className="mb-1 block font-medium">Requesting unit <span className="text-rose-600">*</span></span>
            <select name="unit" value={unit} onChange={(event) => setUnit(event.target.value)} className="field">
                {units.map((value) => (
                  <option key={value} value={value}>
                    {value}
                    {value === "AMT" ? " — Administrative Management Team" : ""}
                    {value === "SSMT" ? " — Support Services Management Team" : ""}
                  </option>
                ))}
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
            <span className="mb-1 block font-medium">Requested by <span className="text-rose-600">*</span></span>
            <input name="requestedBy" required className="field" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Request date <span className="text-rose-600">*</span></span>
            <input type="date" name="requestDate" required defaultValue={todayISO()} className="field" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Item / equipment <span className="text-rose-600">*</span></span>
            <input name="itemName" required className="field" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Specifications <span className="text-rose-600">*</span></span>
            <textarea name="specifications" required rows={3} className="field" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Quantity <span className="text-rose-600">*</span></span>
            <input name="quantity" required type="number" min={1} defaultValue={1} className="field" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Estimated cost (PHP)</span>
            <input
              name="estimatedCost"
              type="text"
              inputMode="decimal"
              value={estimatedCost}
              onChange={(event) => updateEstimatedCost(event.target.value)}
              className="field"
              placeholder="₱0.00"
            />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Justification <span className="text-rose-600">*</span></span>
            <textarea name="justification" required rows={3} className="field" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Supporting files</span>
            <input
              name="attachments"
              type="file"
              multiple
              accept=".pdf,.xls,.xlsx,.doc,.docx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="field"
            />
            <span className="mt-1 block text-xs text-[#6b6254]">PDF, Excel, or Word files up to 10 MB each.</span>
          </label>
        </div>
      </section>
      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
        {saving ? "Filing…" : "Submit procurement request"}
      </button>
    </form>
  );
}
