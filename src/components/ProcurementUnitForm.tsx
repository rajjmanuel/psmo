"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ModalTrigger } from "@/components/Modal";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { authFetch } from "@/lib/auth-fetch";

type ProcurementUnit = { id: number; name: string };

export function ProcurementUnitForm({ units }: { units: ProcurementUnit[] }) {
  return (
    <ModalTrigger
      label="Add requesting unit"
      title="Add requesting unit"
      description="Create a unit that can file procurement requests alongside AMT and SSMT."
      variant="ghost"
    >
      {({ close }) => <ProcurementUnitFields units={units} onDone={close} />}
    </ModalTrigger>
  );
}

function ProcurementUnitFields({ units: initialUnits, onDone }: { units: ProcurementUnit[]; onDone: () => void }) {
  const router = useRouter();
  const { name: actorName } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [units, setUnits] = useState(initialUnits);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await authFetch("/api/procurement-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, actor: actorName }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; id?: number; name?: string };
      if (!res.ok) {
        setError(data.error ?? "Unable to add requesting unit.");
        return;
      }
      toast.success("Requesting unit added", `${data.name} is now available for procurement requests.`);
      setUnits((current) => [...current, { id: data.id ?? Date.now(), name: data.name ?? name }]);
      setName("");
      onDone();
      router.refresh();
    } catch {
      setError("Unable to reach the server. Your entry is still here; please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function removeUnit(unit: ProcurementUnit) {
    if (!window.confirm(`Delete requesting unit ${unit.name}?`)) return;
    const res = await authFetch("/api/procurement-units", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: unit.id, actor: actorName }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error("Unable to delete requesting unit", data.error ?? "Please try again.");
      return;
    }
    setUnits((current) => current.filter((item) => item.id !== unit.id));
    toast.success("Requesting unit deleted", `${unit.name} was removed.`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[#e4dccb] bg-white p-5">
      {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Requesting unit name</span>
        <input required value={name} onChange={(event) => setName(event.target.value)} className="field" placeholder="e.g. Accounting" />
      </label>
      <div className="mt-5 border-t border-[#eee6d6] pt-4">
        <p className="mb-2 text-sm font-medium">Saved requesting units</p>
        <div className="space-y-2">
          {units.map((unit) => (
            <div key={unit.id} className="flex items-center justify-between rounded-lg border border-[#e4dccb] px-3 py-2 text-sm">
              <span>{unit.name}</span>
              <button type="button" onClick={() => removeUnit(unit)} className="text-xs font-medium text-rose-700 hover:underline">
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary mt-5 disabled:opacity-60">
        {saving ? "Saving…" : "Save requesting unit"}
      </button>
    </form>
  );
}
