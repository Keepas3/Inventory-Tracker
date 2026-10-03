import { db } from "@/db";
import { itemEvents, items } from "@/db/schema";
import { buildDemoData } from "./demo-data";

/**
 * Replaces ALL inventory data with a freshly generated demo dataset. Used by the seed script and by
 * the daily refresh cron. Runs as one libSQL batch (a transaction), so visitors never see a half-empty demo.
 * Item ids are assigned explicitly so history rows can reference them inside the same batch.
 */
export async function reseedDemo(now: Date = new Date()) {
  const records = buildDemoData(now);
  const itemRows = records.map((r, i) => ({ ...r.item, id: i + 1 }));
  const eventRows = records.flatMap((r, i) => r.events.map((e) => ({ itemId: i + 1, ...e })));

  await db.batch([
    db.delete(itemEvents),
    db.delete(items),
    db.insert(items).values(itemRows),
    db.insert(itemEvents).values(eventRows),
  ]);
  return { items: itemRows.length, events: eventRows.length };
}
