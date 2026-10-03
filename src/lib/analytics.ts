import type { Item, ItemEvent } from "@/db/schema";

export const CONSUMPTION_WINDOW_DAYS = 90;
export const RESTOCK_HORIZON_DAYS = 14; // suggest a restock when stock is projected to run out within this
export const RESTOCK_TARGET_DAYS = 30; // ...and buy enough to cover this many days

type EventLike = Pick<ItemEvent, "itemId" | "kind" | "delta" | "createdAt">;
type ItemLike = Pick<Item, "id" | "name" | "category" | "quantity" | "minQuantity" | "unitPriceCents" | "purchaseDate">;

/** SQLite CURRENT_TIMESTAMP is "YYYY-MM-DD HH:MM:SS" in UTC; ISO dates have no time part. */
const toMs = (ts: string) => Date.parse(ts.includes("T") ? ts : ts.replace(" ", "T") + (ts.length > 10 ? "Z" : "T00:00:00Z"));

/**
 * Units used per day for one item, from its negative quantity changes inside the window.
 * The observation span runs from the item's first event (or the window start, if later) to `now`,
 * so a new item isn't diluted by days before it existed.
 */
export function consumptionPerDay(events: EventLike[], now: Date = new Date(), windowDays = CONSUMPTION_WINDOW_DAYS): number {
  if (events.length === 0) return 0;
  const nowMs = now.getTime();
  const windowStart = nowMs - windowDays * 86_400_000;
  const firstMs = Math.min(...events.map((e) => toMs(e.createdAt)));
  const spanDays = Math.max(7, (nowMs - Math.max(firstMs, windowStart)) / 86_400_000); // floor of a week avoids wild rates from one early tap
  const used = events
    .filter((e) => e.kind !== "created" && e.delta < 0 && toMs(e.createdAt) >= windowStart)
    .reduce((n, e) => n - e.delta, 0);
  return used / spanDays;
}

export interface RestockSuggestion {
  item: ItemLike;
  perDay: number;
  /** Days until stock hits zero at the current rate; null if it isn't being consumed. */
  daysLeft: number | null;
  suggestedQty: number;
  reason: "out" | "low" | "running-out";
}

export function restockSuggestions(items: ItemLike[], events: EventLike[], now: Date = new Date()): RestockSuggestion[] {
  const byItem = new Map<number, EventLike[]>();
  for (const e of events) (byItem.get(e.itemId) ?? byItem.set(e.itemId, []).get(e.itemId)!).push(e);

  const out: RestockSuggestion[] = [];
  for (const item of items) {
    const perDay = consumptionPerDay(byItem.get(item.id) ?? [], now);
    const daysLeft = perDay > 0 ? item.quantity / perDay : null;
    const belowThreshold = item.minQuantity > 0 && item.quantity <= item.minQuantity;
    const runningOut = daysLeft !== null && daysLeft <= RESTOCK_HORIZON_DAYS;
    if (!belowThreshold && !runningOut) continue;

    const forTarget = Math.ceil(perDay * RESTOCK_TARGET_DAYS) - item.quantity;
    const forThreshold = item.minQuantity * 2 - item.quantity; // refill to twice the alert level
    const suggestedQty = Math.max(1, forTarget, belowThreshold ? forThreshold : 0);

    out.push({ item, perDay, daysLeft, suggestedQty, reason: item.quantity === 0 ? "out" : belowThreshold ? "low" : "running-out" });
  }
  // Most urgent first: out of stock, then soonest to run out.
  return out.sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity) || a.item.name.localeCompare(b.item.name));
}

export interface SpendRow {
  label: string;
  cents: number;
}

/** What was originally bought: the 'created' event's quantity if we have it, else the current quantity. */
function purchasedQty(item: ItemLike, created: Map<number, number>) {
  return created.get(item.id) ?? item.quantity;
}

function createdQuantities(events: EventLike[]) {
  const m = new Map<number, number>();
  for (const e of events) if (e.kind === "created") m.set(e.itemId, (m.get(e.itemId) ?? 0) + e.delta);
  return m;
}

/** Spend per YYYY-MM for items with a purchase date and price, oldest first, for the trailing `months`. */
export function spendByMonth(items: ItemLike[], events: EventLike[], now: Date = new Date(), months = 12): SpendRow[] {
  const created = createdQuantities(events);
  const totals = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    totals.set(d.toISOString().slice(0, 7), 0);
  }
  for (const item of items) {
    if (!item.purchaseDate || item.unitPriceCents === null) continue;
    const key = item.purchaseDate.slice(0, 7);
    if (totals.has(key)) totals.set(key, totals.get(key)! + item.unitPriceCents * purchasedQty(item, created));
  }
  return [...totals].map(([label, cents]) => ({ label, cents }));
}

/** Current stock value by category, largest first. */
export function valueByCategory(items: ItemLike[]): SpendRow[] {
  const totals = new Map<string, number>();
  for (const i of items) totals.set(i.category, (totals.get(i.category) ?? 0) + i.quantity * (i.unitPriceCents ?? 0));
  return [...totals].map(([label, cents]) => ({ label, cents })).filter((r) => r.cents > 0).sort((a, b) => b.cents - a.cents);
}
