"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth, useAuthUpdater } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { authFetch } from "@/lib/auth-fetch";
import { persistSessionToken } from "@/lib/persist-session";

export const USER_ROLES = [
  { value: "admin", label: "PSMO Admin — full access incl. user management" },
  { value: "staff", label: "PSMO Staff — inventory, disposal, procurement" },
  { value: "amt", label: "AMT Officer — Administrative Management Team" },
  { value: "ssmt", label: "SSMT Officer — Support Services Management Team" },
  { value: "accounting", label: "Accounting — payments and MRR" },
];

export type EditableUser = {
  id: number;
  username: string;
  name: string;
  role: string;
  active: boolean;
};

export function UserForm({
  initial,
  onSuccess,
}: {
  initial?: EditableUser;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const { name: actorName, id: currentUserId } = useAuth();
  const setAuthUser = useAuthUpdater();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(initial?.id);
  const isSelf = initial?.id === currentUserId;

  async function onSubmit(formData: FormData) {
    setSaving(true);
    setError("");

    const name = String(formData.get("name") ?? "").trim();
    const role = String(formData.get("role") ?? "staff");
    const password = String(formData.get("password") ?? "");

    const payload: Record<string, unknown> = { name, role, actor: actorName };

    if (isEdit) {
      // The "active" checkbox is disabled when editing your own account, and
      // disabled form fields are excluded from FormData entirely. Only send
      // this field when it was actually present/editable in the form.
      if (!isSelf) {
        payload.active = formData.get("active") === "on";
      }
      if (password) payload.password = password;
    } else {
      payload.username = String(formData.get("username") ?? "").trim();
      payload.password = password;
    }

    const url = isEdit ? `/api/users/${initial!.id}` : "/api/users";
    const res = await authFetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      username?: string;
      name?: string;
    };
    setSaving(false);

    if (!res.ok) {
      toast.error(
        isEdit ? "Unable to update account" : "Unable to create account",
        data.error ?? "Please review the form and try again.",
      );
      setError(data.error ?? "Request failed.");
      return;
    }

    if (isEdit) {
      toast.success("Account updated", `${data.name ?? name} has been updated.`);
    } else {
      toast.success(
        "Account created",
        `${name} can now sign in using the username "${data.username ?? payload.username}".`,
      );
    }

    // If you just edited your OWN account, re-issue the session so the new
    // name/role appears immediately in the header/sidebar — no logout needed.
    if (isEdit && isSelf) {
      try {
        const refreshRes = await authFetch("/api/auth/refresh", { method: "POST" });
        const refreshed = (await refreshRes.json().catch(() => ({}))) as {
          id?: number;
          username?: string;
          name?: string;
          role?: string;
          token?: string;
        };
        if (refreshRes.ok && refreshed.id) {
          setAuthUser({
            id: refreshed.id,
            username: refreshed.username ?? initial!.username,
            name: refreshed.name ?? name,
            role: refreshed.role ?? role,
          });
          if (refreshed.token) {
            persistSessionToken(refreshed.token);
          }
        }
      } catch {
        /* the account was still updated in the database; worst case the
           user sees the new name after their next page load. */
      }
    }

    router.refresh();
    onSuccess?.();
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-[#e4dccb] bg-white p-5">
        <h2 className="font-display text-xl">Account details</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          {isEdit
            ? "Update the staff details, role, or access status."
            : "Only PSMO Admin can create accounts. Give the credentials to the staff privately."}
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Full name</span>
            <input
              name="name"
              required
              defaultValue={initial?.name ?? ""}
              placeholder="e.g. Ma'am Mitch"
              className="field"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">Username</span>
            <input
              name="username"
              required={!isEdit}
              defaultValue={initial?.username ?? ""}
              disabled={isEdit}
              placeholder="e.g. mmitch"
              className="field disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            />
            {isEdit ? (
              <span className="mt-1 block text-xs text-[var(--muted)]">
                Username cannot be changed (keeps the audit trail intact).
              </span>
            ) : null}
          </label>

          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">Role &amp; access level</span>
            <select name="role" defaultValue={initial?.role ?? "staff"} className="field">
              {USER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {isSelf ? (
              <span className="mt-1 block text-xs text-amber-700">
                You are editing your own account — you cannot remove your admin role.
              </span>
            ) : null}
          </label>

          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium">
              {isEdit ? "Reset password (optional)" : "Temporary password"}
            </span>
            <input
              type="text"
              name="password"
              required={!isEdit}
              minLength={6}
              placeholder={isEdit ? "Leave blank to keep current password" : "Minimum 6 characters"}
              className="field"
            />
            <span className="mt-1 block text-xs text-[var(--muted)]">
              Advise the staff to change this after their first sign-in.
            </span>
          </label>

          {isEdit ? (
            <label className="flex items-center gap-3 text-sm md:col-span-2">
              <input
                type="checkbox"
                name="active"
                defaultChecked={initial?.active ?? true}
                disabled={isSelf}
                className="h-4 w-4 rounded border-[var(--line)]"
              />
              <span>
                <span className="font-medium">Account is active</span>
                <span className="block text-xs text-[var(--muted)]">
                  Deactivating blocks sign-in but keeps all their records and logs.
                </span>
              </span>
            </label>
          ) : null}
        </div>
      </section>

      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
        {saving ? "Saving…" : isEdit ? "Update account" : "Create account"}
      </button>
    </form>
  );
}
