"use client";

import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/actions";
import type { Item } from "@/db/schema";
import { Button, inputClass, LinkButton } from "./ui";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

// Module-level on purpose: a component defined inside another gets a new identity every render,
// which makes React remount (and reset) its inputs.
function Field({ label, name, hint, error, children }: { label: string; name: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
        {hint && <span className="ml-1 font-normal text-muted">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function ItemForm({ action, item, categories, locations }: { action: Action; item?: Item; categories: string[]; locations: string[] }) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.errors ?? {};
  const invalid = Object.keys(errors).length;

  /** Ties an input to its error message for screen readers. */
  const a11y = (name: string) => ({
    id: name,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {invalid > 0 && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">
          Please fix {invalid === 1 ? "the highlighted field" : `${invalid} highlighted fields`} below.
        </p>
      )}
      <div className="sm:col-span-2">
        <Field label="Name" name="name" error={errors.name}>
          <input {...a11y("name")} defaultValue={item?.name} required maxLength={120} className={inputClass} />
        </Field>
      </div>
      <Field label="Category" name="category" error={errors.category}>
        <input {...a11y("category")} list="categories" defaultValue={item?.category ?? "General"} className={inputClass} />
        <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="Location" name="location" error={errors.location}>
        <input {...a11y("location")} list="locations" defaultValue={item?.location ?? "Unsorted"} className={inputClass} />
        <datalist id="locations">{locations.map((l) => <option key={l} value={l} />)}</datalist>
      </Field>
      <Field label="Quantity" name="quantity" error={errors.quantity}>
        <input {...a11y("quantity")} type="number" min={0} defaultValue={item?.quantity ?? 1} required className={inputClass} />
      </Field>
      <Field label="Alert when quantity ≤" name="minQuantity" hint="(0 = off)" error={errors.minQuantity}>
        <input {...a11y("minQuantity")} type="number" min={0} defaultValue={item?.minQuantity ?? 0} className={inputClass} />
      </Field>
      <Field label="Unit price" name="unitPrice" hint="(USD)" error={errors.unitPrice}>
        <input {...a11y("unitPrice")} type="number" step="0.01" min={0} defaultValue={item?.unitPriceCents != null ? (item.unitPriceCents / 100).toFixed(2) : ""} className={inputClass} />
      </Field>
      <Field label="Purchase date" name="purchaseDate" error={errors.purchaseDate}>
        <input {...a11y("purchaseDate")} type="date" defaultValue={item?.purchaseDate ?? ""} className={inputClass} />
      </Field>
      <Field label="Warranty expires" name="warrantyExpires" error={errors.warrantyExpires}>
        <input {...a11y("warrantyExpires")} type="date" defaultValue={item?.warrantyExpires ?? ""} className={inputClass} />
      </Field>
      <Field label="Expires on" name="expiresOn" error={errors.expiresOn}>
        <input {...a11y("expiresOn")} type="date" defaultValue={item?.expiresOn ?? ""} className={inputClass} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Notes" name="notes" error={errors.notes}>
          <textarea {...a11y("notes")} rows={3} defaultValue={item?.notes ?? ""} className={inputClass} />
        </Field>
      </div>
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : item ? "Save changes" : "Add item"}
        </Button>
        <LinkButton href="/" variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
