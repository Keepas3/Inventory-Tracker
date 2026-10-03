import { describe, expect, it } from "vitest";
import { restockSuggestions, spendByMonth } from "./analytics";
import { buildDemoData, type DemoRecord } from "./demo-data";
import { getAlerts, itemInputSchema } from "./inventory";
import type { Item, ItemEvent } from "@/db/schema";

const now = new Date("2026-10-03T12:00:00Z");
const data = buildDemoData(now);

/** Turn the generated records into the row/event shapes the analytics code reads from the DB. */
function asDbRows(records: DemoRecord[]) {
  const items = records.map((r, i) => ({ id: i + 1, createdAt: "", updatedAt: "", ...r.item }) as Item);
  const events = records.flatMap((r, i) => r.events.map((e, j) => ({ id: i * 1000 + j, itemId: i + 1, ...e }) as ItemEvent));
  return { items, events };
}

describe("buildDemoData", () => {
  it("is deterministic for a given date and has a believable spread", () => {
    expect(buildDemoData(now)).toEqual(data);
    expect(data.length).toBeGreaterThanOrEqual(35);
    expect(new Set(data.map((r) => r.item.category)).size).toBeGreaterThanOrEqual(6);
    const names = data.map((r) => r.item.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("produces rows the real validator accepts", () => {
    for (const { item } of data) {
      const parsed = itemInputSchema.safeParse({
        name: item.name,
        category: item.category,
        location: item.location,
        quantity: String(item.quantity),
        minQuantity: String(item.minQuantity),
        unitPrice: ((item.unitPriceCents ?? 0) / 100).toFixed(2),
        purchaseDate: item.purchaseDate ?? "",
        warrantyExpires: item.warrantyExpires ?? "",
        expiresOn: item.expiresOn ?? "",
        notes: item.notes ?? "",
      });
      expect(parsed.success, item.name).toBe(true);
    }
  });

  it("keeps quantity consistent with its history (bought minus used)", () => {
    for (const { item, events } of data) {
      expect(events.reduce((n, e) => n + e.delta, 0), item.name).toBe(item.quantity);
      expect(item.quantity).toBeGreaterThanOrEqual(0);
    }
  });

  it("never records usage before the purchase", () => {
    for (const { item, events } of data) {
      const created = events.find((e) => e.kind === "created")!;
      for (const e of events) expect(e.createdAt >= created.createdAt, item.name).toBe(true);
    }
  });

  it("gives each item the same alerts whenever it is regenerated, so the demo never goes stale", () => {
    const alertsByName = (at: Date) => {
      const { items } = asDbRows(buildDemoData(at));
      return Object.fromEntries(items.map((i) => [i.name, getAlerts(i, at).map((a) => a.kind).sort()]));
    };
    const other = new Date("2027-03-14T03:00:00Z"); // months later, different time of day
    expect(alertsByName(other)).toEqual(alertsByName(now));
  });

  it("exercises every alert kind", () => {
    const { items } = asDbRows(data);
    const kinds = new Set(items.flatMap((i) => getAlerts(i, now).map((a) => a.kind)));
    for (const k of ["low-stock", "out-of-stock", "expired", "expiring", "warranty-expired", "warranty-expiring"] as const) {
      expect(kinds.has(k), k).toBe(true);
    }
  });

  it("gives the insights page something to show", () => {
    const { items, events } = asDbRows(data);
    const suggestions = restockSuggestions(items, events, now);
    expect(suggestions.length).toBeGreaterThanOrEqual(4);
    expect(suggestions.some((s) => s.reason === "out")).toBe(true);
    expect(suggestions.some((s) => s.daysLeft !== null)).toBe(true); // rate-based, not just threshold-based
    const months = spendByMonth(items, events, now).filter((m) => m.cents > 0);
    expect(months.length).toBeGreaterThanOrEqual(6);
  });
});
