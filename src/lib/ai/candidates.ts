import { z } from "zod";

/** Shape Claude is asked to return for a photo or receipt. Kept simple: structured outputs reject exotic constraints. */
export const extractionSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe("Short product name, without store codes or SKUs"),
      category: z.string().describe("Broad category such as Electronics, Pantry, Supplies, Cables, Health, Tools"),
      quantity: z.number().int().describe("Units purchased or visible; 1 if unclear"),
      unit_price: z.number().nullable().describe("Price per single unit in dollars, or null if not shown"),
      purchase_date: z.string().nullable().describe("YYYY-MM-DD from a receipt, or null"),
      notes: z.string().nullable().describe("Brand/model or anything ambiguous worth a human double-checking"),
    }),
  ),
  warnings: z.array(z.string()).describe("Anything unreadable, cropped or uncertain about the image as a whole"),
});

export type Extraction = z.infer<typeof extractionSchema>;

/** A row in the review table. Values are strings so they go through the same validation as the manual form. */
export type CandidateRow = Record<
  "name" | "category" | "location" | "quantity" | "minQuantity" | "unitPrice" | "purchaseDate" | "warrantyExpires" | "expiresOn" | "notes",
  string
>;

export function toCandidateRows(extraction: Extraction, defaultLocation = "Unsorted"): CandidateRow[] {
  return extraction.items.map((i) => ({
    name: i.name,
    category: i.category || "General",
    location: defaultLocation,
    quantity: String(Math.max(0, i.quantity)),
    minQuantity: "0",
    unitPrice: i.unit_price === null ? "" : i.unit_price.toFixed(2),
    purchaseDate: i.purchase_date ?? "",
    warrantyExpires: "",
    expiresOn: "",
    notes: i.notes ?? "",
  }));
}
