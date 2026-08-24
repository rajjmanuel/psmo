import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {kicker ? (
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#8a7540]">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-display mt-1 text-3xl text-[#10231c] md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-[#5c564c]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
