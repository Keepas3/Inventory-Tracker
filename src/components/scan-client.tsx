"use client";

import { FileImage, Loader2, ScanLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type ReactNode } from "react";
import { createItems } from "@/app/actions";
import type { CandidateRow } from "@/lib/ai/candidates";
import { Button, buttonClass, Card, inputClass } from "./ui";

const MAX_DIMENSION = 1600;

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

// Module-level so inputs keep their identity (and typed values) across renders.
function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

interface Props {
  aiEnabled: boolean;
  canSave: boolean;
  /** The owner (not a demo visitor) gets setup instructions when AI isn't configured. */
  showSetupHint: boolean;
  locations: string[];
}

export function ScanClient({ aiEnabled, canSave, showSetupHint, locations }: Props) {
  const router = useRouter();
  const locationListId = useId();
  const [location, setLocation] = useState("");
  const [rows, setRows] = useState<CandidateRow[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, startSaving] = useTransition();

  async function scan(file: File) {
    setError(null);
    setRows(null);
    setRowErrors({});
    setScanning(true);
    try {
      const body = new FormData();
      body.set("image", await prepareImage(file));
      if (location.trim()) body.set("location", location.trim());
      const res = await fetch("/api/ai/extract", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setRows(json.rows);
      setWarnings(json.warnings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setScanning(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (file) await scan(file);
    input.value = "";
  }

  async function useSample() {
    try {
      const blob = await (await fetch("/samples/receipt.png")).blob();
      await scan(new File([blob], "sample-receipt.png", { type: "image/png" }));
    } catch {
      setError("Couldn't load the sample receipt.");
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
      router.push("/inventory?toast=scanned");
    });
  }

  const disabled = !aiEnabled || scanning;
  const uploadClass = buttonClass(
    "primary",
    "md",
    `cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring ${disabled ? "pointer-events-none opacity-50" : ""}`,
  );

  return (
    <div className="space-y-6">
      {!aiEnabled && (
        <p role="status" className="rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">
          {showSetupHint ? (
            <>
              AI isn&apos;t configured on this server. Add <code>ANTHROPIC_API_KEY</code> to <code>.env.local</code> and restart.
            </>
          ) : (
            "AI features are paused on this deployment right now. Check back soon."
          )}
        </p>
      )}
      {!canSave && aiEnabled && (
        <p role="note" className="rounded-lg bg-brand-soft px-4 py-3 text-sm text-brand-text">
          This is a read-only demo. Scanning works and you can review the result, but nothing is saved.
        </p>
      )}

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Where is it stored? (optional)">
            <input value={location} onChange={(e) => setLocation(e.target.value)} list={locationListId} placeholder="e.g. Office closet" className={inputClass} />
            <datalist id={locationListId}>
              {locations.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className={uploadClass}>
              <ScanLine className="size-4" aria-hidden /> Choose photo or receipt
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" capture="environment" onChange={onFile} disabled={disabled} className="sr-only" />
            </label>
            <Button type="button" variant="secondary" onClick={useSample} disabled={disabled}>
              <FileImage className="size-4" aria-hidden /> Try a sample receipt
            </Button>
          </div>
        </div>
        {scanning && (
          <p role="status" className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Reading the image. This usually takes a few seconds.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}
      </Card>

      {rows && (
        <section aria-labelledby="review" className="space-y-4">
          <div>
            <h2 id="review" className="text-lg font-semibold">
              Review before saving
            </h2>
            <p className="text-sm text-muted">The AI can misread things. Fix anything wrong, remove rows you don&apos;t want, then save.</p>
          </div>

          {warnings.length > 0 && (
            <ul className="list-disc rounded-lg bg-warn-soft py-3 pl-8 pr-4 text-sm text-warn">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}

          {rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-muted">No items left. Choose another image.</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((r, i) => (
                <li key={i}>
                  <Card className={`p-4 ${rowErrors[i] ? "border-danger" : ""}`}>
                    <div className="mb-3 flex items-start gap-3">
                      <Field label="Name" className="flex-1">
                        <input value={r.name} onChange={(e) => update(i, "name", e.target.value)} className={inputClass} />
                      </Field>
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        aria-label={`Remove ${r.name || "this row"}`}
                        title="Remove"
                        className="mt-5 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                      <Field label="Category" className="lg:col-span-2">
                        <input value={r.category} onChange={(e) => update(i, "category", e.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Location" className="lg:col-span-2">
                        <input value={r.location} onChange={(e) => update(i, "location", e.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Quantity">
                        <input type="number" min={0} value={r.quantity} onChange={(e) => update(i, "quantity", e.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Unit price ($)">
                        <input type="number" step="0.01" min={0} value={r.unitPrice} onChange={(e) => update(i, "unitPrice", e.target.value)} className={inputClass} />
                      </Field>
                      <Field label="Purchased" className="col-span-2 sm:col-span-1 lg:col-span-2">
                        <input type="date" value={r.purchaseDate} onChange={(e) => update(i, "purchaseDate", e.target.value)} className={inputClass} />
                      </Field>
                    </div>
                    {r.notes && <p className="mt-3 text-xs text-muted">Note from the AI: {r.notes}</p>}
                    {rowErrors[i] && (
                      <p role="alert" className="mt-2 text-xs text-danger">
                        {rowErrors[i]}
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {canSave ? (
              <Button onClick={save} disabled={saving || rows.length === 0}>
                {saving ? "Saving…" : `Save ${rows.length} item${rows.length === 1 ? "" : "s"}`}
              </Button>
            ) : (
              <p className="text-sm text-muted">Read-only demo: these items aren&apos;t saved.</p>
            )}
            <Button variant="ghost" onClick={() => setRows(null)}>
              Discard
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
