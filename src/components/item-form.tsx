"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/actions";
import type { Item } from "@/db/schema";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const input =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500";

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ItemForm({ action, item, categories, locations }: { action: Action; item?: Item; categories: string[]; locations: string[] }) {
  const [state, formAction, pending] = useActionState(action, {});
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Name" name="name" error={e.name}>
          <input id="name" name="name" defaultValue={item?.name} required className={input} />
        </Field>
      </div>
      <Field label="Category" name="category" error={e.category}>
        <input id="category" name="category" list="categories" defaultValue={item?.category ?? "General"} className={input} />
        <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="Location" name="location" error={e.location}>
        <input id="location" name="location" list="locations" defaultValue={item?.location ?? "Unsorted"} className={input} />
        <datalist id="locations">{locations.map((l) => <option key={l} value={l} />)}</datalist>
      </Field>
      <Field label="Quantity" name="quantity" error={e.quantity}>
        <input id="quantity" name="quantity" type="number" min={0} defaultValue={item?.quantity ?? 1} required className={input} />
      </Field>
      <Field label="Alert when quantity ≤ (0 = off)" name="minQuantity" error={e.minQuantity}>
        <input id="minQuantity" name="minQuantity" type="number" min={0} defaultValue={item?.minQuantity ?? 0} className={input} />
      </Field>
      <Field label="Unit price (USD)" name="unitPrice" error={e.unitPrice}>
        <input id="unitPrice" name="unitPrice" type="number" step="0.01" min={0} defaultValue={item?.unitPriceCents != null ? (item.unitPriceCents / 100).toFixed(2) : ""} className={input} />
      </Field>
      <Field label="Purchase date" name="purchaseDate" error={e.purchaseDate}>
        <input id="purchaseDate" name="purchaseDate" type="date" defaultValue={item?.purchaseDate ?? ""} className={input} />
      </Field>
      <Field label="Warranty expires" name="warrantyExpires" error={e.warrantyExpires}>
        <input id="warrantyExpires" name="warrantyExpires" type="date" defaultValue={item?.warrantyExpires ?? ""} className={input} />
      </Field>
      <Field label="Expires on" name="expiresOn" error={e.expiresOn}>
        <input id="expiresOn" name="expiresOn" type="date" defaultValue={item?.expiresOn ?? ""} className={input} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Notes" name="notes" error={e.notes}>
          <textarea id="notes" name="notes" rows={3} defaultValue={item?.notes ?? ""} className={input} />
        </Field>
      </div>
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
          {pending ? "Saving…" : item ? "Save changes" : "Add item"}
        </button>
        <Link href="/" className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">
          Cancel
        </Link>
      </div>
    </form>
  );
}
