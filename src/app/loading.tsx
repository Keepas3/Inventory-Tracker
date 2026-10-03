import { Skeleton } from "@/components/skeleton";

// Generic fallback for any route without its own loading.tsx.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-10" aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <Skeleton className="mt-6 h-40 w-full" />
    </main>
  );
}
