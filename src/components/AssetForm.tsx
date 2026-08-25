"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ASSET_CATEGORIES, ASSET_STATUSES } from "@/lib/constants";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { authFetch } from "@/lib/auth-fetch";
import { todayISO } from "@/lib/format";

type Office = { id: number; name: string; code: string; type: string };

type AssetValues = {
  id?: number;
  taggingNo?: string;
  description?: string;
  brand?: string | null;
  model?: string | null;
  serialNo?: string | null;
  partsNo?: string | null;
  dateOfPurchase?: string | null;
  officeId?: number | null;
  locationNote?: string | null;
  status?: string;
  category?: string | null;
  unitCost?: string | null;
  source?: string;
  condition?: string | null;
  remarks?: string | null;
};

export function AssetForm({
  offices,
  initial,
  onSuccess,
}: {
  offices: Office[];
  initial?: AssetValues;
  onSuccess?: (id: number) => void;
}) {
  const router = useRouter();
  const { name: actorName } = useAuth();
  const toast = useToast();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    taggingNo: initial?.taggingNo ?? "",
    description: initial?.description ?? "",
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    serialNo: initial?.serialNo ?? "",
    partsNo: initial?.partsNo ?? "",
    dateOfPurchase: initial?.dateOfPurchase ?? todayISO(),
    unitCost: initial?.unitCost ?? "",
    officeId: initial?.officeId ? String(initial.officeId) : "",
    locationNote: initial?.locationNote ?? "",
    source: initial?.source ?? "office",
    status: initial?.status ?? "serviceable",
    category: initial?.category ?? "",
    condition: initial?.condition ?? "",
    remarks: initial?.remarks ?? "",
  });

  function updateField(name: keyof typeof formValues, value: string) {
    setFormValues((current) => ({ ...current, [name]: value }));
  }

  async function onSubmit() {
    if (!formValues.description.trim()) {
      const message = "Description is required before recording this item.";
      setError(message);
      toast.error("Missing description", message);
      return;
    }

    setSaving(true);
    setError("");
    const payload = {
      ...formValues,
      description: formValues.description.trim(),
      officeId: formValues.officeId ? Number(formValues.officeId) : null,
      recordedBy: actorName,
      actor: actorName,
    };

    try {
      const url = initial?.id ? `/api/assets/${initial.id}` : "/api/assets";
      const res = await authFetch(url, {
        method: initial?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: number;
        error?: string;
        taggingNo?: string;
        description?: string;
        disposalRequestNo?: string;
      };
      if (!res.ok) {
        const message = data.error ?? "The inventory request failed.";
        toast.error("Unable to save item", message);
        setError(message);
        return;
      }
      const label = data.taggingNo || formValues.description || "New item";
      if (initial?.id) {
        toast.success(
          "Record updated",
          data.disposalRequestNo
            ? `${label} moved to For Disposal. Disposal request ${data.disposalRequestNo} was created automatically.`
            : `${label} has been updated on the ledger.`,
        );
      } else {
        toast.success("Item recorded to inventory", `${label} is now on the PSMO ledger.`);
      }
      router.refresh();
      if (data.id && onSuccess) {
        onSuccess(data.id);
      } else {
        router.push(data.id ? `/inventory/${data.id}` : "/inventory");
      }
    } catch {
      const message = "The inventory request could not reach the server. Your entries are still here; please try again.";
      toast.error("Unable to save item", message);
      setError(message);
    } finally {
      setSaving(false);
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
        <h2 className="font-display text-xl">Item description</h2>
        <p className="mb-4 text-sm text-[#6b6254]">
          Tagging No., Brand, Model, S/N, Parts No., DOP, Location, Status
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Tagging No."
            hint="Leave blank to auto-issue PSMO-YYYY-0000"
            hintClassName="text-blue-600"
          >
            <input
              name="taggingNo"
              value={formValues.taggingNo}
              onChange={(event) => updateField("taggingNo", event.target.value)}
              className="field"
              placeholder="PSMO-2026-0000"
            />
          </Field>
          <Field label="Description" required>
            <input
              name="description"
              required
              value={formValues.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="field"
              placeholder="Desktop computer, centrifuge, filing cabinet…"
            />
          </Field>
          <Field label="Brand">
            <input name="brand" value={formValues.brand} onChange={(event) => updateField("brand", event.target.value)} className="field" />
          </Field>
          <Field label="Model">
            <input name="model" value={formValues.model} onChange={(event) => updateField("model", event.target.value)} className="field" />
          </Field>
          <Field label="Serial No. (S/N)">
            <input name="serialNo" value={formValues.serialNo} onChange={(event) => updateField("serialNo", event.target.value)} className="field" />
          </Field>
          <Field label="Parts No.">
            <input name="partsNo" value={formValues.partsNo} onChange={(event) => updateField("partsNo", event.target.value)} className="field" />
          </Field>
          <Field label="Date of Purchase (DOP)">
            <input
              type="date"
              name="dateOfPurchase"
              value={formValues.dateOfPurchase}
              onChange={(event) => updateField("dateOfPurchase", event.target.value)}
              className="field"
            />
          </Field>
          <Field label="Unit cost (PHP)">
            <input
              name="unitCost"
              type="number"
              step="0.01"
              value={formValues.unitCost}
              onChange={(event) => updateField("unitCost", event.target.value)}
              className="field"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
        <h2 className="font-display mb-4 text-xl">Location & status</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Office / Laboratory">
            <select name="officeId" value={formValues.officeId} onChange={(event) => updateField("officeId", event.target.value)} className="field">
              <option value="">Select location</option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.code} — {office.name} ({office.type})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Exact location">
            <input
              name="locationNote"
              value={formValues.locationNote}
              onChange={(event) => updateField("locationNote", event.target.value)}
              className="field"
              placeholder="Row A, Bench 3, Storeroom…"
            />
          </Field>
          <Field label="Source">
            <select name="source" value={formValues.source} onChange={(event) => updateField("source", event.target.value)} className="field">
              <option value="office">Offices (All System)</option>
              <option value="laboratory">Laboratory</option>
            </select>
          </Field>
          <Field label="Status">
            <select name="status" value={formValues.status} onChange={(event) => updateField("status", event.target.value)} className="field">
              {ASSET_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select name="category" value={formValues.category} onChange={(event) => updateField("category", event.target.value)} className="field">
              <option value="">Select category</option>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Condition">
            <input name="condition" value={formValues.condition} onChange={(event) => updateField("condition", event.target.value)} className="field" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Remarks">
              <textarea
                name="remarks"
                rows={3}
                value={formValues.remarks}
                onChange={(event) => updateField("remarks", event.target.value)}
                className="field"
              />
            </Field>
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-[#10231c] px-5 py-2.5 text-sm font-medium text-[#f3eee4] disabled:opacity-60"
      >
        {saving ? "Saving…" : initial?.id ? "Update property record" : "Record to inventory"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  hintClassName,
  required,
  children,
}: {
  label: string;
  hint?: string;
  hintClassName?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[#2c382f]">
        {label}
        {required ? <span className="text-rose-600"> *</span> : null}
      </span>
      {children}
      {hint ? (
        <span
          className={`mt-1 block text-xs ${hintClassName ?? "text-[#8a8070]"}`}
          style={hintClassName ? { color: "#2563eb" } : undefined}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}
