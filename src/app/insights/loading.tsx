import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:py-10" aria-busy="true">
      <span className="sr-only" role="status">
        Loading insights…
      </span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Skeleton className="h-[74px]" />
        <Skeleton className="h-[74px]" />
        <Skeleton className="col-span-2 h-[74px] sm:col-span-1" />
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="grid gap-10 md:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </main>
  );
}
