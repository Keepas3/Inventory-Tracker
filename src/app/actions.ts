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
