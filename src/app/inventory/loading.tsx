import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10" aria-busy="true">
      <span className="sr-only" role="status">
        Loading inventory…
      </span>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Skeleton className="h-[74px]" />
        <Skeleton className="h-[74px]" />
        <Skeleton className="col-span-2 h-[74px] sm:col-span-1" />
      </div>
      <Skeleton className="mb-3 h-10 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </main>
  );
}
