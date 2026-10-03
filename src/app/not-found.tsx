import { Compass } from "lucide-react";
import Link from "next/link";
import { buttonClass, EmptyState } from "@/components/ui";

export const metadata = { title: "Page not found" };

// Renders inside the root layout, so the nav, footer and theme all carry over.
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <EmptyState icon={Compass} title="That page doesn't exist" description="The link may be broken, or the item may have been deleted.">
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/inventory" className={buttonClass("primary")}>
            Go to inventory
          </Link>
          <Link href="/" className={buttonClass("secondary")}>
            Home
          </Link>
        </div>
      </EmptyState>
    </main>
  );
}
