"use client"; // Error boundaries must be Client Components

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonClass, EmptyState } from "@/components/ui";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // Hook for an error-reporting service. In production the message is masked; the digest matches the server log.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <EmptyState icon={TriangleAlert} title="Something went wrong" description="That didn't work, and it wasn't your fault. Trying again often fixes it.">
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => retry()}>
            <RefreshCw className="size-4" aria-hidden /> Try again
          </Button>
          <Link href="/" className={buttonClass("secondary")}>
            Go home
          </Link>
        </div>
        {error.digest && <p className="mt-2 text-xs text-muted">Reference: {error.digest}</p>}
      </EmptyState>
    </main>
  );
}
