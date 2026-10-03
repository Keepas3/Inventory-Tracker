import "server-only";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";

export interface ItemFilters {
  q?: string;
  category?: string;
  location?: string;
  sort?: "name" | "newest" | "quantity";
}

export async function listItems({ q, category, location, sort = "name" }: ItemFilters = {}) {
  // Escape LIKE wildcards so user input is matched literally.
  const term = q?.trim().replace(/[\%_]/g, "\$&");
  const where = and(
    term ? or(like(items.name, `%${term}%`), like(items.notes, `%${term}%`)) : undefined,
    category ? eq(items.category, category) : undefined,
    location ? eq(items.location, location) : undefined,
  );
  const order = sort === "newest" ? desc(items.createdAt) : sort === "quantity" ? asc(items.quantity) : asc(items.name);
  return db.select().from(items).where(where).orderBy(order);
}

export async function getItem(id: number) {
  const [row] = await db.select().from(items).where(eq(items.id, id));
  return row ?? null;
}

export async function getFacets() {
  const rows = await db.select({ category: items.category, location: items.location }).from(items);
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));
  return { categories: uniq(rows.map((r) => r.category)), locations: uniq(rows.map((r) => r.location)) };
}
