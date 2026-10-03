"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createItems } from "@/app/actions";
import type { CandidateRow } from "@/lib/ai/candidates";

const MAX_DIMENSION = 1600;
const cell = "w-full rounded border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700";

/** Downscale big phone photos before upload: faster, cheaper, and under the server's size cap. */
async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  return blob ? new File([blob], "upload.jpg", { type: "image/jpeg" }) : file;
}

export function ScanClient({ aiEnabled, canSave, locations }: { aiEnabled: boolean; canSave: boolean; locations: string[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<CandidateRow[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, startSaving] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setError(null);
    setRows(null);
    setRowErrors({});
    setScanning(true);
    try {
      const body = new FormData();
      body.set("image", await prepareImage(file));
      const location = (document.getElementById("default-location") as HTMLInputElement | null)?.value;
      if (location) body.set("location", location);

      const res = await fetch("/api/ai/extract", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setRows(json.rows);
      setWarnings(json.warnings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setScanning(false);
      input.value = "";
    }
  }

  const update = (i: number, key: keyof CandidateRow, value: string) =>
    setRows((rs) => rs?.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)) ?? null);
  const remove = (i: number) => setRows((rs) => rs?.filter((_, idx) => idx !== i) ?? null);

  function save() {
    if (!rows?.length) return;
    startSaving(async () => {
      const result = await createItems(rows);
      if (result.errors) {
        setRowErrors(result.errors);
        return;
      }
      router.push("/");
    });
  }

  return (
    <div className="space-y-6">
      {!aiEnabled && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
          AI isn&apos;t configured on this server. Add <code>ANTHROPIC_API_KEY</code> to <code>.env.local</code> and restart.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="default-location" className="mb-1 block text-sm font-medium">
            Where is this stored?
          </label>
          <input id="default-location" list="scan-locations" placeholder="e.g. Office closet" className={`${cell} w-56`} />
          <datalist id="scan-locations">{locations.map((l) => <option key={l} value={l} />)}</datalist>
        </div>
        <label className={`cursor-pointer rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 ${!aiEnabled || scanning ? "pointer-events-none opacity-50" : ""}`}>
          {scanning ? "Reading image…" : "Choose photo or receipt"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" capture="environment" onChange={onFile} disabled={!aiEnabled || scanning} className="sr-only" />
        </label>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {rows && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Review before saving</h2>
          <p className="text-sm text-zinc-500">The AI can misread things. Fix anything wrong, remove rows you don&apos;t want, then save.</p>
          {warnings.length > 0 && (
            <ul className="list-disc rounded-md bg-amber-50 p-3 pl-7 text-sm dark:bg-amber-950/30">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
          {rows.length === 0 ? (
            <p className="text-sm text-zinc-500">No items left. Choose another image.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
                  <tr>
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Location</th>
                    <th className="w-20 px-2 py-2">Qty</th>
                    <th className="w-24 px-2 py-2">Unit $</th>
                    <th className="w-36 px-2 py-2">Purchased</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {rows.map((r, i) => (
                    <tr key={i} className={rowErrors[i] ? "bg-red-50 dark:bg-red-950/20" : undefined}>
                      <td className="px-2 py-2">
                        <input aria-label="Name" value={r.name} onChange={(e) => update(i, "name", e.target.value)} className={cell} />
                        {r.notes && <div className="mt-1 text-xs text-zinc-500">{r.notes}</div>}
                        {rowErrors[i] && <div className="mt-1 text-xs text-red-600">{rowErrors[i]}</div>}
                      </td>
                      <td className="px-2 py-2"><input aria-label="Category" value={r.category} onChange={(e) => update(i, "category", e.target.value)} className={cell} /></td>
                      <td className="px-2 py-2"><input aria-label="Location" value={r.location} onChange={(e) => update(i, "location", e.target.value)} className={cell} /></td>
                      <td className="px-2 py-2"><input aria-label="Quantity" type="number" min={0} value={r.quantity} onChange={(e) => update(i, "quantity", e.target.value)} className={cell} /></td>
                      <td className="px-2 py-2"><input aria-label="Unit price" type="number" step="0.01" min={0} value={r.unitPrice} onChange={(e) => update(i, "unitPrice", e.target.value)} className={cell} /></td>
                      <td className="px-2 py-2"><input aria-label="Purchase date" type="date" value={r.purchaseDate} onChange={(e) => update(i, "purchaseDate", e.target.value)} className={cell} /></td>
                      <td className="px-2 py-2"><button onClick={() => remove(i)} className="text-xs text-red-600 hover:underline">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {canSave ? (
            <button onClick={save} disabled={saving || rows.length === 0} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {saving ? "Saving…" : `Save ${rows.length} item${rows.length === 1 ? "" : "s"}`}
            </button>
          ) : (
            <p className="text-sm text-zinc-500">This is a read-only demo, so extracted items aren&apos;t saved.</p>
          )}
        </section>
      )}
    </div>
  );
}
