"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ModalTrigger } from "@/components/Modal";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { authFetch } from "@/lib/auth-fetch";

type Office = {
  id: number;
  name: string;
  code: string;
  type: string;
  head: string | null;
  floor: string | null;
  contact: string | null;
};

export function OfficeEditForm({ office }: { office: Office }) {
  return (
    <ModalTrigger
      label={
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      }
      ariaLabel="Edit office or laboratory"
      title={`Edit ${office.code}`}
      description="Correct the office or laboratory details."
      variant="ghost"
      buttonClassName="!h-9 !w-9 !p-0"
    >
      {({ close }) => <OfficeEditFields office={office} onDone={close} />}
    </ModalTrigger>
  );
}

function OfficeEditFields({ office, onDone }: { office: Office; onDone: () => void }) {
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
    const res = await authFetch("/api/offices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: office.id,
        name,
        code,
        type: String(formData.get("type") ?? office.type),
        head: String(formData.get("head") ?? ""),
        floor: String(formData.get("floor") ?? ""),
        contact: String(formData.get("contact") ?? ""),
        actor: actorName,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to update office or laboratory.");
      toast.error("Unable to update office / lab", data.error ?? "Please review the form and try again.");
      return;
    }
    toast.success("Office / laboratory updated", `${name || code} was updated.`);
    onDone();
    router.refresh();
  }

  return (
    <form action={onSubmit} className="rounded-2xl border border-[#e4dccb] bg-white p-5">
      {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm"><span className="mb-1 block font-medium">Name</span><input name="name" required defaultValue={office.name} className="field" /></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Code</span><input name="code" required defaultValue={office.code} className="field" /></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Type</span><select name="type" defaultValue={office.type} className="field"><option value="office">Office</option><option value="laboratory">Laboratory</option></select></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Head / focal</span><input name="head" defaultValue={office.head ?? ""} className="field" /></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Floor / building</span><input name="floor" defaultValue={office.floor ?? ""} className="field" /></label>
        <label className="text-sm"><span className="mb-1 block font-medium">Contact</span><input name="contact" defaultValue={office.contact ?? ""} className="field" /></label>
      </div>
      <button type="submit" disabled={saving} className="btn-primary mt-5 disabled:opacity-60">{saving ? "Saving…" : "Update office / laboratory"}</button>
    </form>
  );
}