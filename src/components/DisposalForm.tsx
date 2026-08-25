"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { authFetch } from "@/lib/auth-fetch";
import { todayISO } from "@/lib/format";

type Office = { id: number; name: string; code: string; type: string };
type Asset = {
  id: number;
  taggingNo: string;
  description: string;
  status: string;
  officeName: string | null;
};

export function DisposalForm({
  offices,
  assets,
  onSuccess,
}: {
  offices: Office[];
  assets: Asset[];
  onSuccess?: (id: number) => void;
}) {
  const router = useRouter();
  const { name: actorName } = useAuth();
  const toast = useToast();
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const eligible = useMemo(
    () =>
      assets.filter((a) =>
        ["unserviceable", "for-disposal", "under-repair"].includes(a.status),
      ),
    [assets],
  );

  const visible = eligible.filter((a) => {
    const hay = `${a.taggingNo} ${a.description} ${a.officeName ?? ""}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  function toggle(id: number) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function onSubmit(formData: FormData) {
    if (selected.length === 0) {
      const message = "Select at least one item before filing a disposal request.";
      setError(message);
      toast.error("No item selected", message);
      return;
    }

    setSaving(true);
    setError("");
    const res = await authFetch("/api/disposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        officeId: formData.get("officeId") ? Number(formData.get("officeId")) : null,
        requestedBy: String(formData.get("requestedBy") ?? ""),
        requestDate: String(formData.get("requestDate") ?? todayISO()),
        reason: String(formData.get("reason") ?? ""),
        remarks: String(formData.get("remarks") ?? ""),
        assetIds: selected,
        actor: actorName,
      }),
    });
    const data = (await res.json()) as {
      id?: number;
      error?: string;
      requestNo?: string;
    };
    setSaving(false);
    if (!res.ok) {
      toast.error("Unable to file disposal request", data.error ?? "Please review the form and try again.");
      setError(data.error ?? "Unable to file disposal request.");
      return;
    }
    toast.success(
      "Disposal request filed",
      `${data.requestNo ?? "New request"} created for ${selected.length} item(s). PSMO will endorse via Excel & IOM.`,
    );
    router.refresh();
    if (data.id && onSuccess) {
      onSuccess(data.id);
    } else {
      router.push(`/disposal/${data.id}`);
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
        <h2 className="font-display text-xl">Request from office / laboratory</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Requesting unit</span>
            <select name="officeId" className="field" required>
              <option value="">Select office or laboratory</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} — {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Requested by</span>
            <input name="requestedBy" required className="field" placeholder="Name of requestor" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Request date</span>
            <input type="date" name="requestDate" defaultValue={todayISO()} className="field" />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Reason for disposal</span>
            <textarea name="reason" rows={3} className="field" required />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Remarks</span>
            <textarea name="remarks" rows={2} className="field" />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Items to dispose</h2>
            <p className="text-sm text-[#6b6254]">
              Unserviceable, under-repair, and already tagged for disposal.
            </p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter tagged items"
            className="field max-w-xs"
          />
        </div>
          <div className="overflow-x-auto rounded-xl border border-[#eee6d6]">
            <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#f7f1e6] text-[11px] uppercase tracking-wider text-[#6b6254]">
              <tr>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2">Tagging No.</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((asset) => (
                <tr key={asset.id} className="border-t border-[#eee6d6]">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(asset.id)}
                      onChange={() => toggle(asset.id)}
                    />
                  </td>
                  <td className="px-3 py-2 font-medium">{asset.taggingNo}</td>
                  <td className="px-3 py-2">{asset.description}</td>
                  <td className="px-3 py-2">{asset.officeName ?? "—"}</td>
                  <td className="px-3 py-2 capitalize">{asset.status.replace("-", " ")}</td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[#8a8070]">
                    No eligible property matches this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-[#8a8070]">{selected.length} item(s) selected</p>
      </section>

      <button
        type="submit"
        disabled={saving || selected.length === 0}
        className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Filing…" : "File disposal request"}
      </button>
    </form>
  );
}
