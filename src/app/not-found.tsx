import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#8a7540]">PSMO Ledger</p>
      <h1 className="font-display mt-2 text-4xl">Record not found</h1>
      <p className="mt-3 text-sm text-[#5c564c]">
        That tagging number, disposal, or procurement request is not on file.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Return to ledger home
      </Link>
    </div>
  );
}
