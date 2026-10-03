import { ScanClient } from "@/components/scan-client";
import { isAiConfigured } from "@/lib/ai/config";
import { getAccess } from "@/lib/auth";
import { getFacets } from "@/lib/queries";

export const metadata = { title: "Scan" };
export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const [{ locations }, { canWrite }] = await Promise.all([getFacets(), getAccess()]);
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Scan a receipt or shelf</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Take or upload a photo and Claude turns it into inventory items. You review everything before it&apos;s saved.</p>
      <ScanClient aiEnabled={isAiConfigured()} canSave={canWrite} showSetupHint={canWrite} locations={locations} />
    </main>
  );
}
