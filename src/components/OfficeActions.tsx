"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { authFetch } from "@/lib/auth-fetch";
import Swal from "sweetalert2";

export function OfficeActions({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const { name: actorName, role } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (role !== "admin") return null;

  async function remove() {
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete this entry?",
      text: `${name} will be permanently removed if it has no linked records.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#be123c",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });
    if (!confirmation.isConfirmed) return;
    setBusy(true);
    try {
      const response = await authFetch("/api/offices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, actor: actorName }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        linkedRecords?: { inventory: number; disposal: number; procurement: number };
      };
      if (!response.ok) {
        if (response.status === 409 && data.linkedRecords) {
          const records = [
            ["Inventory", data.linkedRecords.inventory],
            ["Disposal requests", data.linkedRecords.disposal],
            ["Procurement requests", data.linkedRecords.procurement],
          ];
          await Swal.fire({
            icon: "warning",
            title: "Office / lab is still in use",
            text: "This entry cannot be deleted while linked records exist.",
            html: `<h3 style="margin:14px 0 6px;text-align:left;font-size:14px;font-weight:600;color:#0f172a">List of linked records</h3><table style="width:100%;text-align:left;border-collapse:collapse;margin-top:8px"><tbody>${records
              .map(
                ([label, count]) =>
                  `<tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${label}</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${count}</td></tr>`,
              )
              .join("")}</tbody></table>`,
            confirmButtonText: "Close",
            confirmButtonColor: "#2563eb",
          });
          return;
        }
        toast.error(
          "Unable to delete office / lab",
          data.error ?? "Please try again.",
        );
        return;
      }
      toast.success("Office / laboratory deleted", `${name} was removed.`);
      router.refresh();
    } catch {
      toast.error("Unable to delete office / lab", "The request could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={remove}
      title="Delete office or laboratory"
      className="rounded-lg border border-rose-300 bg-rose-50 p-2 text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16" />
        <path d="M10 11v6M14 11v6" />
        <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
      </svg>
      <span className="sr-only">{busy ? "Deleting" : "Delete"}</span>
    </button>
  );
}