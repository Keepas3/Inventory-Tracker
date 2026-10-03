import { AskClient } from "@/components/ask-client";
import { isAiConfigured } from "@/lib/ai/config";
import { getAccess } from "@/lib/auth";

export const metadata = { title: "Ask" };
// Reads runtime env (is the API key set?), so it must not be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function AskPage() {
  const { canWrite } = await getAccess();
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Ask your inventory</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Plain-English questions, answered by Claude querying your actual data. It can only read, never change anything.</p>
      <AskClient aiEnabled={isAiConfigured()} showSetupHint={canWrite} />
    </main>
  );
}
