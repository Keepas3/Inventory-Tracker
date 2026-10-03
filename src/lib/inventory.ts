import { z } from "zod";
import type { Item } from "@/db/schema";

export const ALERT_WINDOW_DAYS = 30;

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.union([z.null(), z.iso.date()]));

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v));

/** Validates the raw strings coming out of FormData (also reused for AI-extracted items). */
export const itemInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  category: z.string().trim().min(1).max(60).default("General"),
  location: z.string().trim().min(1).max(60).default("Unsorted"),
  quantity: z.coerce.number().int().min(0).max(1_000_000),
  minQuantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
  // Entered in dollars, stored as cents.
  unitPrice: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.union([z.null(), z.number().min(0).max(10_000_000)]))
    .transform((v) => (v === null ? null : Math.round(v * 100))),
  purchaseDate: optionalDate,
  warrantyExpires: optionalDate,
  expiresOn: optionalDate,
  notes: optionalText,
});

export type ItemInput = z.infer<typeof itemInputSchema>;

export type AlertKind = "low-stock" | "out-of-stock" | "expired" | "expiring" | "warranty-expired" | "warranty-expiring";

export interface Alert {
  kind: AlertKind;
  label: string;
  severity: "danger" | "warn";
}

/** Whole days from `today` to an ISO date (negative = in the past). */
export function daysUntil(isoDate: string, today: Date = new Date()): number {
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const [y, m, d] = isoDate.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - start) / 86_400_000);
}

export function getAlerts(item: Pick<Item, "quantity" | "minQuantity" | "expiresOn" | "warrantyExpires">, today: Date = new Date()): Alert[] {
  const alerts: Alert[] = [];

  if (item.minQuantity > 0) {
    if (item.quantity === 0) alerts.push({ kind: "out-of-stock", label: "Out of stock", severity: "danger" });
    else if (item.quantity <= item.minQuantity) alerts.push({ kind: "low-stock", label: "Low stock", severity: "warn" });
  }

  if (item.expiresOn) {
    const d = daysUntil(item.expiresOn, today);
    if (d < 0) alerts.push({ kind: "expired", label: "Expired", severity: "danger" });
    else if (d <= ALERT_WINDOW_DAYS) alerts.push({ kind: "expiring", label: `Expires in ${d}d`, severity: "warn" });
  }

  if (item.warrantyExpires) {
    const d = daysUntil(item.warrantyExpires, today);
    if (d < 0) alerts.push({ kind: "warranty-expired", label: "Warranty expired", severity: "danger" });
    else if (d <= ALERT_WINDOW_DAYS) alerts.push({ kind: "warranty-expiring", label: `Warranty ends in ${d}d`, severity: "warn" });
  }

  return alerts;
}

export function formatCents(cents: number | null): string {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function totalValueCents(list: Pick<Item, "quantity" | "unitPriceCents">[]): number {
  return list.reduce((sum, i) => sum + i.quantity * (i.unitPriceCents ?? 0), 0);
}
