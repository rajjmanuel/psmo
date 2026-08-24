"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { authFetch } from "@/lib/auth-fetch";
import { ModalTrigger } from "@/components/Modal";

export function OfficeForm() {
  return (
    <ModalTrigger
      label="Add office / lab"
      title="Add office or laboratory"
      description="Register an All System office or laboratory location for inventory, disposal, and procurement tracking."
    >
      {({ close }) => <OfficeFields onDone={close} />}
    </ModalTrigger>
  );
}

function OfficeFields({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const { name: actorName } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    setSaving(true);
    setError("");
    const name = String(formData.get("name") ?? "");
    const code = String(formData.get("code") ?? "");
    const type = String(formData.get("type") ?? "office");

    const res = await authFetch("/api/offices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        code,
        type,
        head: String(formData.get("head") ?? ""),
        floor: String(formData.get("floor") ?? ""),
        contact: String(formData.get("contact") ?? ""),
        actor: actorName,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error("Unable to add office / lab", data.error ?? "Please review the form and try again.");
      setError(data.error ?? "Unable to add office / lab.");
      return;
    }

    toast.success("Office / laboratory added", `${name || code} is now available across the system.`);
    onDone();
    router.refresh();
  }

  return (
    <form action={onSubmit} className="rounded-2xl border border-[#e4dccb] bg-white p-5">
      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Name</span>
          <input name="name" required placeholder="Office / Laboratory name" className="field" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Code</span>
          <input name="code" required placeholder="PSMO, CHEM, COMP…" className="field" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Type</span>
          <select name="type" className="field">
            <option value="office">Office</option>
            <option value="laboratory">Laboratory</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Head / focal</span>
          <input name="head" placeholder="Unit head or focal person" className="field" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Floor / building</span>
          <input name="floor" placeholder="Ground Floor, Science Bldg…" className="field" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Contact</span>
          <input name="contact" placeholder="Local / email / phone" className="field" />
        </label>
      </div>
      <button type="submit" disabled={saving} className="btn-primary mt-5 disabled:opacity-60">
        {saving ? "Saving…" : "Save office / laboratory"}
      </button>
    </form>
  );
}
