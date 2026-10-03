import { describe, expect, it } from "vitest";
import { daysUntil, formatCents, getAlerts, itemInputSchema, totalValueCents } from "./inventory";

const today = new Date("2026-10-03T12:00:00Z");
const base = { quantity: 5, minQuantity: 0, expiresOn: null, warrantyExpires: null };

describe("daysUntil", () => {
  it("counts whole days, negative in the past", () => {
    expect(daysUntil("2026-10-03", today)).toBe(0);
    expect(daysUntil("2026-10-10", today)).toBe(7);
    expect(daysUntil("2026-10-01", today)).toBe(-2);
  });
});

describe("getAlerts", () => {
  it("returns nothing for a healthy item", () => {
    expect(getAlerts(base, today)).toEqual([]);
  });
  it("flags low and out of stock only when a threshold is set", () => {
    expect(getAlerts({ ...base, quantity: 1, minQuantity: 2 }, today)[0].kind).toBe("low-stock");
    expect(getAlerts({ ...base, quantity: 0, minQuantity: 2 }, today)[0].kind).toBe("out-of-stock");
    expect(getAlerts({ ...base, quantity: 0, minQuantity: 0 }, today)).toEqual([]);
  });
  it("flags expired vs expiring within the window", () => {
    expect(getAlerts({ ...base, expiresOn: "2026-10-02" }, today)[0].kind).toBe("expired");
    expect(getAlerts({ ...base, expiresOn: "2026-10-20" }, today)[0].kind).toBe("expiring");
    expect(getAlerts({ ...base, expiresOn: "2027-06-01" }, today)).toEqual([]);
  });
  it("flags warranty states", () => {
    expect(getAlerts({ ...base, warrantyExpires: "2026-09-01" }, today)[0].kind).toBe("warranty-expired");
    expect(getAlerts({ ...base, warrantyExpires: "2026-10-30" }, today)[0].kind).toBe("warranty-expiring");
  });
});

describe("itemInputSchema", () => {
  const raw = { name: "  Cable ", quantity: "3", unitPrice: "12.99", purchaseDate: "", warrantyExpires: "", expiresOn: "", notes: "" };
  it("normalises form strings", () => {
    const r = itemInputSchema.parse(raw);
    expect(r).toMatchObject({ name: "Cable", quantity: 3, unitPrice: 1299, purchaseDate: null, notes: null, category: "General" });
  });
  it("rejects bad input", () => {
    expect(itemInputSchema.safeParse({ ...raw, name: " " }).success).toBe(false);
    expect(itemInputSchema.safeParse({ ...raw, quantity: "-1" }).success).toBe(false);
    expect(itemInputSchema.safeParse({ ...raw, expiresOn: "not-a-date" }).success).toBe(false);
  });
});

describe("money", () => {
  it("formats and totals cents", () => {
    expect(formatCents(1299)).toBe("$12.99");
    expect(formatCents(null)).toBe("—");
    expect(totalValueCents([{ quantity: 2, unitPriceCents: 500 }, { quantity: 1, unitPriceCents: null }])).toBe(1000);
  });
});
