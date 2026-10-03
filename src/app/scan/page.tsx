import { ScanClient } from "@/components/scan-client";
import { isAiConfigured } from "@/lib/ai/config";
import { getFacets } from "@/lib/queries";

export const metadata = { title: "Scan — Stockpile" };
export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const { locations } = await getFacets();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Scan a receipt or shelf</h1>
      <p className="mb-6 text-sm text-zinc-500">Take or upload a photo and Claude turns it into inventory items. You review everything before it&apos;s saved.</p>
      <ScanClient aiEnabled={isAiConfigured()} locations={locations} />
    </main>
  );
}
