import { AskClient } from "@/components/ask-client";
import { isAiConfigured } from "@/lib/ai/config";

export const metadata = { title: "Ask — Stockpile" };
// Reads runtime env (is the API key set?), so it must not be prerendered at build time.
export const dynamic = "force-dynamic";

export default function AskPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Ask your inventory</h1>
      <p className="mb-6 text-sm text-zinc-500">Plain-English questions, answered by Claude querying your actual data. Read-only.</p>
      <AskClient aiEnabled={isAiConfigured()} />
    </main>
  );
}
