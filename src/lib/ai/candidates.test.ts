import { describe, expect, it } from "vitest";
import { itemInputSchema } from "@/lib/inventory";
import { extractionSchema, toCandidateRows } from "./candidates";

const extraction = extractionSchema.parse({
  items: [
    { name: "AA batteries", category: "Supplies", quantity: 2, unit_price: 10.99, purchase_date: "2026-09-30", notes: null },
    { name: "Mystery cable", category: "", quantity: -1, unit_price: null, purchase_date: null, notes: "Label unreadable" },
  ],
  warnings: [],
});

describe("toCandidateRows", () => {
  const rows = toCandidateRows(extraction, "Office");

  it("maps model output to form-style strings", () => {
    expect(rows[0]).toMatchObject({ name: "AA batteries", quantity: "2", unitPrice: "10.99", purchaseDate: "2026-09-30", location: "Office" });
  });

  it("clamps negatives and fills defaults for sloppy model output", () => {
    expect(rows[1]).toMatchObject({ category: "General", quantity: "0", unitPrice: "" });
  });

  it("produces rows the real item validator accepts", () => {
    for (const row of rows) expect(itemInputSchema.safeParse(row).success).toBe(true);
  });
});
