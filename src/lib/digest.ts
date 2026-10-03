import type { Item, ItemEvent } from "@/db/schema";
import { restockSuggestions, type RestockSuggestion } from "./analytics";
import { getAlerts, type Alert } from "./inventory";

export interface Digest {
  attention: { item: Item; alerts: Alert[] }[];
  restock: RestockSuggestion[];
  isEmpty: boolean;
  subject: string;
  text: string;
  html: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const restockLine = (r: RestockSuggestion) => {
  const when = r.reason === "out" ? "out of stock" : r.daysLeft !== null ? `~${Math.max(0, Math.round(r.daysLeft))} days left` : "below your alert level";
  return `${r.item.name}: ${when}, buy ${r.suggestedQty}`;
};
const attentionLine = (a: { item: Item; alerts: Alert[] }) => `${a.item.name}: ${a.alerts.map((x) => x.label).join(", ")}`;

export function buildDigest(items: Item[], events: ItemEvent[], now: Date = new Date()): Digest {
  const attention = items.map((item) => ({ item, alerts: getAlerts(item, now) })).filter((r) => r.alerts.length > 0);
  const restock = restockSuggestions(items, events, now);
  const isEmpty = attention.length === 0 && restock.length === 0;
  // An item can be in both lists (e.g. out of stock and needs buying); count it once.
  const total = new Set([...attention.map((a) => a.item.id), ...restock.map((r) => r.item.id)]).size;

  const subject = isEmpty ? "Stockpile: all good this week" : `Stockpile: ${total} thing${total === 1 ? "" : "s"} need your attention`;

  const textParts = [`Stockpile weekly digest, ${now.toISOString().slice(0, 10)}`, ""];
  if (isEmpty) textParts.push("Nothing needs attention. Stock levels, expiries and warranties all look fine.");
  if (attention.length) textParts.push("NEEDS ATTENTION", ...attention.map((a) => `- ${attentionLine(a)}`), "");
  if (restock.length) textParts.push("SHOPPING LIST", ...restock.map((r) => `- ${restockLine(r)}`), "");

  const section = (title: string, lines: string[]) => (lines.length ? `<h3 style="margin:16px 0 4px">${title}</h3><ul style="margin:0;padding-left:20px">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : "");
  const html =
    `<div style="font-family:system-ui,sans-serif;max-width:560px"><h2 style="margin:0 0 8px">Stockpile weekly digest</h2>` +
    (isEmpty ? "<p>Nothing needs attention. Stock levels, expiries and warranties all look fine.</p>" : "") +
    section("Needs attention", attention.map(attentionLine)) +
    section("Shopping list", restock.map(restockLine)) +
    `</div>`;

  return { attention, restock, isEmpty, subject, text: textParts.join("\n").trimEnd(), html };
}
