import { Package } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-white">
        <Package className="size-4" aria-hidden />
      </span>
      Stockpile
    </span>
  );
}
