import { cn } from "@/lib/format";

export function WorkflowStepper({
  steps,
  current,
}: {
  steps: readonly { value: string; label: string }[];
  current: string;
}) {
  const currentIndex = steps.findIndex((s) => s.value === current);
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, index) => {
        const done = currentIndex > index || current === "completed" || current === "disposed";
        const active = step.value === current;
        return (
          <li
            key={step.value}
            className={cn(
              "rounded-xl border px-3 py-2",
              active
                ? "border-[#c4a35a] bg-[#f7efd8]"
                : done
                  ? "border-[#c9d9cf] bg-[#eef4ef]"
                  : "border-[#e4dccb] bg-white",
            )}
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8a7540]">
              Step {index + 1}
            </p>
            <p className="text-sm font-medium text-[#10231c]">{step.label}</p>
          </li>
        );
      })}
    </ol>
  );
}
