"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { items } from "@/db/schema";
import { itemInputSchema } from "@/lib/inventory";

export interface FormState {
  errors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  const parsed = itemInputSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) return { data: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
  return { errors };
}

function toRow(d: NonNullable<ReturnType<typeof parseForm>["data"]>) {
  const { unitPrice, ...rest } = d;
  return { ...rest, unitPriceCents: unitPrice };
}

// NOTE: no auth yet. Phase 4 adds sessions + a read-only public demo mode before deploying.

export async function createItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const { data, errors } = parseForm(formData);
  if (!data) return { errors };
  await db.insert(items).values(toRow(data));
  revalidatePath("/");
  redirect("/");
}

export async function updateItem(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const { data, errors } = parseForm(formData);
  if (!data) return { errors };
  await db
    .update(items)
    .set({ ...toRow(data), updatedAt: sql`(CURRENT_TIMESTAMP)` })
    .where(eq(items.id, id));
  revalidatePath("/");
  redirect("/");
}

export interface BulkResult {
  saved?: number;
  /** Row index → first error message, so the review table can highlight bad rows. */
  errors?: Record<number, string>;
}

/** Saves reviewed AI-extracted rows. Every row goes through the same validation as the manual form. */
export async function createItems(rows: Record<string, string>[]): Promise<BulkResult> {
  if (rows.length === 0 || rows.length > 100) return { errors: { 0: "Provide between 1 and 100 rows." } };

  const valid: ReturnType<typeof toRow>[] = [];
  const errors: Record<number, string> = {};
  rows.forEach((row, i) => {
    const parsed = itemInputSchema.safeParse(row);
    if (parsed.success) valid.push(toRow(parsed.data));
    else errors[i] = parsed.error.issues[0]?.message ?? "Invalid row";
  });
  // All-or-nothing, so a partially saved receipt can't be saved twice by accident.
  if (Object.keys(errors).length > 0) return { errors };

  await db.insert(items).values(valid);
  revalidatePath("/");
  return { saved: valid.length };
}

export async function deleteItem(id: number) {
  await db.delete(items).where(eq(items.id, id));
  revalidatePath("/");
}

export async function adjustQuantity(id: number, delta: 1 | -1) {
  await db
    .update(items)
    .set({ quantity: sql`max(0, ${items.quantity} + ${delta})`, updatedAt: sql`(CURRENT_TIMESTAMP)` })
    .where(eq(items.id, id));
  revalidatePath("/");
}
