import { describe, expect, it } from "vitest";
import type { Item } from "@/db/schema";
import { buildDigest } from "./digest";

const now = new Date("2026-10-03T12:00:00Z");
const mk = (over: Partial<Item>): Item => ({
  id: 1, name: "Thing", category: "General", location: "Unsorted", quantity: 5, minQuantity: 0, unitPriceCents: null,
  purchaseDate: null, warrantyExpires: null, expiresOn: null, notes: null, createdAt: "", updatedAt: "", ...over,
});

describe("buildDigest", () => {
  it("reports all-good when nothing needs attention", () => {
    const d = buildDigest([mk({})], [], now);
    expect(d.isEmpty).toBe(true);
    expect(d.subject).toMatch(/all good/);
  });

  it("lists attention items and shopping suggestions", () => {
    const d = buildDigest([mk({ id: 1, name: "Milk", expiresOn: "2026-10-05" }), mk({ id: 2, name: "Paper", quantity: 0, minQuantity: 2 })], [], now);
    expect(d.isEmpty).toBe(false);
    expect(d.subject).toBe("Stockpile: 2 things need your attention");
    expect(d.text).toContain("Milk: Expires in 2d");
    expect(d.text).toContain("Paper: out of stock, buy 4");
  });

  it("escapes user-controlled item names in the HTML body", () => {
    const d = buildDigest([mk({ name: '<script>alert("x")</script>', expiresOn: "2026-10-01" })], [], now);
    expect(d.html).not.toContain("<script>");
    expect(d.html).toContain("&lt;script&gt;");
  });
});
