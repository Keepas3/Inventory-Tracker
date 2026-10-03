import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const items = sqliteTable(
  "items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    category: text("category").notNull().default("General"),
    location: text("location").notNull().default("Unsorted"),
    quantity: integer("quantity").notNull().default(1),
    // Alert threshold: item shows as "low stock" when quantity <= minQuantity (0 = disabled).
    minQuantity: integer("min_quantity").notNull().default(0),
    // Money is stored as integer cents to avoid float rounding.
    unitPriceCents: integer("unit_price_cents"),
    purchaseDate: text("purchase_date"), // ISO yyyy-mm-dd
    warrantyExpires: text("warranty_expires"), // ISO yyyy-mm-dd
    expiresOn: text("expires_on"), // ISO yyyy-mm-dd (consumables)
    notes: text("notes"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [index("items_category_idx").on(t.category), index("items_location_idx").on(t.location)],
);

/** Append-only log of quantity changes; the source for consumption rates and restock suggestions. */
export const itemEvents = sqliteTable(
  "item_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itemId: integer("item_id").notNull(),
    kind: text("kind", { enum: ["created", "adjust", "edit"] }).notNull(),
    delta: integer("delta").notNull(), // units added (+) or used (-)
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [index("item_events_item_idx").on(t.itemId)],
);

export type ItemEvent = typeof itemEvents.$inferSelect;
export type NewItemEvent = typeof itemEvents.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
