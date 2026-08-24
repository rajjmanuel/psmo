import Link from "next/link";

export function EmptyState({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d2c8b4] bg-white/60 px-6 py-14 text-center">
      <p className="font-display text-2xl text-[#10231c]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#6b6254]">{body}</p>
      {href && action ? (
        <Link
          href={href}
          className="mt-5 inline-flex rounded-full bg-[#10231c] px-4 py-2 text-sm text-[#f3eee4]"
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}
