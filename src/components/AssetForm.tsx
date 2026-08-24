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

  async function onSubmit(formData: FormData) {
    setSaving(true);
    setError("");
    const payload = {
      taggingNo: String(formData.get("taggingNo") ?? ""),
      description: String(formData.get("description") ?? ""),
      brand: String(formData.get("brand") ?? ""),
      model: String(formData.get("model") ?? ""),
      serialNo: String(formData.get("serialNo") ?? ""),
      partsNo: String(formData.get("partsNo") ?? ""),
      dateOfPurchase: String(formData.get("dateOfPurchase") ?? ""),
      officeId: formData.get("officeId") ? Number(formData.get("officeId")) : null,
      locationNote: String(formData.get("locationNote") ?? ""),
      status: String(formData.get("status") ?? "serviceable"),
      category: String(formData.get("category") ?? ""),
      unitCost: String(formData.get("unitCost") ?? ""),
      source: String(formData.get("source") ?? "office"),
      condition: String(formData.get("condition") ?? ""),
      remarks: String(formData.get("remarks") ?? ""),
      recordedBy: actorName,
      actor: actorName,
    };

    const url = initial?.id ? `/api/assets/${initial.id}` : "/api/assets";
    const res = await authFetch(url, {
      method: initial?.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      id?: number;
      error?: string;
      taggingNo?: string;
      description?: string;
    };
    setSaving(false);
    if (!res.ok) {
      toast.error("Unable to save item", data.error ?? "The inventory request failed.");
      setError(data.error ?? "Unable to save asset.");
      return;
    }
    const label = data.taggingNo || String(formData.get("description") ?? "New item");
    if (initial?.id) {
      toast.success("Record updated", `${label} has been updated on the ledger.`);
    } else {
      toast.success("Item recorded to inventory", `${label} is now on the PSMO ledger.`);
    }
    router.refresh();
    if (data.id && onSuccess) {
      onSuccess(data.id);
    } else {
      router.push(data.id ? `/inventory/${data.id}` : "/inventory");
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
          <Field label="Tagging No." hint="Leave blank to auto-issue PSMO-YYYY-0000">
            <input
              name="taggingNo"
              defaultValue={initial?.taggingNo ?? ""}
              className="field"
              placeholder="PSMO-2026-0000"
            />
          </Field>
          <Field label="Description" required>
            <input
              name="description"
              required
              defaultValue={initial?.description ?? ""}
              className="field"
              placeholder="Desktop computer, centrifuge, filing cabinet…"
            />
          </Field>
          <Field label="Brand">
            <input name="brand" defaultValue={initial?.brand ?? ""} className="field" />
          </Field>
          <Field label="Model">
            <input name="model" defaultValue={initial?.model ?? ""} className="field" />
          </Field>
          <Field label="Serial No. (S/N)">
            <input name="serialNo" defaultValue={initial?.serialNo ?? ""} className="field" />
          </Field>
          <Field label="Parts No.">
            <input name="partsNo" defaultValue={initial?.partsNo ?? ""} className="field" />
          </Field>
          <Field label="Date of Purchase (DOP)">
            <input
              type="date"
              name="dateOfPurchase"
              defaultValue={initial?.dateOfPurchase ?? todayISO()}
              className="field"
            />
          </Field>
          <Field label="Unit cost (PHP)">
            <input
              name="unitCost"
              type="number"
              step="0.01"
              defaultValue={initial?.unitCost ?? ""}
              className="field"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
        <h2 className="font-display mb-4 text-xl">Location & status</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Office / Laboratory">
            <select name="officeId" defaultValue={initial?.officeId ?? ""} className="field">
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
              defaultValue={initial?.locationNote ?? ""}
              className="field"
              placeholder="Row A, Bench 3, Storeroom…"
            />
          </Field>
          <Field label="Source">
            <select name="source" defaultValue={initial?.source ?? "office"} className="field">
              <option value="office">Offices (All System)</option>
              <option value="laboratory">Laboratory</option>
            </select>
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={initial?.status ?? "serviceable"} className="field">
              {ASSET_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select name="category" defaultValue={initial?.category ?? ""} className="field">
              <option value="">Select category</option>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Condition">
            <input name="condition" defaultValue={initial?.condition ?? ""} className="field" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Remarks">
              <textarea
                name="remarks"
                rows={3}
                defaultValue={initial?.remarks ?? ""}
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
  required,
  children,
}: {
  label: string;
  hint?: string;
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
      {hint ? <span className="mt-1 block text-xs text-[#8a8070]">{hint}</span> : null}
    </label>
  );
}
