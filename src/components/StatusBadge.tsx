import { cn } from "@/lib/format";

const TONES: Record<string, string> = {
  serviceable: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "in-stock": "bg-sky-50 text-sky-800 ring-sky-200",
  "under-repair": "bg-amber-50 text-amber-900 ring-amber-200",
  unserviceable: "bg-rose-50 text-rose-800 ring-rose-200",
  "for-disposal": "bg-orange-50 text-orange-900 ring-orange-200",
  disposed: "bg-stone-100 text-stone-600 ring-stone-300",
  requested: "bg-slate-100 text-slate-700 ring-slate-200",
  endorsed: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  verified: "bg-teal-50 text-teal-800 ring-teal-200",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-800 ring-rose-200",
  canvassing: "bg-amber-50 text-amber-900 ring-amber-200",
  comparative: "bg-violet-50 text-violet-800 ring-violet-200",
  "for-approval": "bg-yellow-50 text-yellow-900 ring-yellow-200",
  "po-issued": "bg-cyan-50 text-cyan-900 ring-cyan-200",
  payment: "bg-lime-50 text-lime-900 ring-lime-200",
  delivery: "bg-blue-50 text-blue-800 ring-blue-200",
  received: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  completed: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  office: "bg-[#f3eee4] text-[#3d4f45] ring-[#ddd4c3]",
  laboratory: "bg-[#eef4ef] text-[#1f4d38] ring-[#c9d9cf]",
};

function pretty(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function StatusBadge({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  if (!value) return <span className="text-stone-400">—</span>;
  return (
    <span
      className={cn(
        "status-badge inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1",
        TONES[value] ?? "bg-stone-100 text-stone-700 ring-stone-200",
        className,
      )}
    >
      {pretty(value)}
    </span>
  );
}
