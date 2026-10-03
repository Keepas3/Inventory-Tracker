import { describe, expect, it } from "vitest";
import { consumptionPerDay, restockSuggestions, spendByMonth, valueByCategory } from "./analytics";

const now = new Date("2026-10-03T12:00:00Z");
const ev = (itemId: number, kind: "created" | "adjust" | "edit", delta: number, createdAt: string) => ({ itemId, kind, delta, createdAt });
const item = (id: number, over = {}) => ({ id, name: `item${id}`, category: "Supplies", quantity: 5, minQuantity: 0, unitPriceCents: 1000, purchaseDate: null, ...over });

describe("consumptionPerDay", () => {
  it("is zero with no events or only a creation", () => {
    expect(consumptionPerDay([], now)).toBe(0);
    expect(consumptionPerDay([ev(1, "created", 10, "2026-09-01 00:00:00")], now)).toBe(0);
  });
  it("divides units used by days observed", () => {
    // created 30 days ago, used 6 units since -> 0.2/day
    const events = [ev(1, "created", 10, "2026-09-03 12:00:00"), ev(1, "adjust", -3, "2026-09-10 12:00:00"), ev(1, "adjust", -3, "2026-09-20 12:00:00")];
    expect(consumptionPerDay(events, now)).toBeCloseTo(0.2, 2);
  });
  it("ignores usage outside the window and restocks (positive deltas)", () => {
    const events = [ev(1, "created", 10, "2026-01-01 00:00:00"), ev(1, "adjust", -9, "2026-02-01 00:00:00"), ev(1, "adjust", 5, "2026-09-30 00:00:00")];
    expect(consumptionPerDay(events, now)).toBe(0);
  });
  it("floors the span at a week so one early tap doesn't spike the rate", () => {
    const events = [ev(1, "created", 5, "2026-10-02 12:00:00"), ev(1, "adjust", -1, "2026-10-02 13:00:00")];
    expect(consumptionPerDay(events, now)).toBeCloseTo(1 / 7, 3);
  });
});

describe("restockSuggestions", () => {
  const usedA = [ev(1, "created", 10, "2026-09-03 12:00:00"), ev(1, "adjust", -6, "2026-09-25 12:00:00")]; // ~0.2/day

  it("suggests items projected to run out soon, sized to 30 days of use", () => {
    const [s] = restockSuggestions([item(1, { quantity: 2 })], usedA, now); // 2 / 0.2 = 10 days left
    expect(s.reason).toBe("running-out");
    expect(s.daysLeft).toBeCloseTo(10, 0);
    expect(s.suggestedQty).toBe(4); // ceil(0.2*30)=6 minus 2 on hand
  });
  it("does not suggest well-stocked, steadily-used items", () => {
    expect(restockSuggestions([item(1, { quantity: 50 })], usedA, now)).toEqual([]);
  });
  it("flags below-threshold items even with no history, and out-of-stock first", () => {
    const res = restockSuggestions([item(1, { quantity: 1, minQuantity: 2 }), item(2, { quantity: 0, minQuantity: 2 })], [], now);
    expect(res.map((r) => r.item.id).sort()).toEqual([1, 2]);
    expect(res.find((r) => r.item.id === 2)!.reason).toBe("out");
    expect(res.find((r) => r.item.id === 1)!.suggestedQty).toBe(3); // refill to 2x threshold
  });
  it("ignores items with no usage and no threshold", () => {
    expect(restockSuggestions([item(1, { quantity: 0 })], [], now)).toEqual([]);
  });
});

describe("spend", () => {
  it("buckets spend by purchase month using the originally purchased quantity", () => {
    const items = [item(1, { quantity: 1, purchaseDate: "2026-09-15", unitPriceCents: 500 }), item(2, { purchaseDate: "2025-01-01" }), item(3, { purchaseDate: null })];
    const rows = spendByMonth(items, [ev(1, "created", 4, "2026-09-15 00:00:00")], now, 3);
    expect(rows.map((r) => r.label)).toEqual(["2026-08", "2026-09", "2026-10"]);
    expect(rows[1].cents).toBe(2000); // 4 bought, not the 1 remaining
    expect(rows[0].cents + rows[2].cents).toBe(0); // out-of-range / undated items excluded
  });
  it("sums current value by category, largest first, dropping zeros", () => {
    const rows = valueByCategory([item(1, { category: "A", quantity: 1, unitPriceCents: 100 }), item(2, { category: "B", quantity: 2, unitPriceCents: 500 }), item(3, { category: "C", unitPriceCents: null })]);
    expect(rows).toEqual([{ label: "B", cents: 1000 }, { label: "A", cents: 100 }]);
  });
});
