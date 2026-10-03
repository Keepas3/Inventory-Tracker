import { restockSuggestions, spendByMonth, valueByCategory, type SpendRow } from "@/lib/analytics";
import { formatCents } from "@/lib/inventory";
import { listEvents, listItems } from "@/lib/queries";

export const metadata = { title: "Insights — Stockpile" };
export const dynamic = "force-dynamic";

const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });

function Bars({ rows, label = (s: string) => s, empty }: { rows: SpendRow[]; label?: (s: string) => string; empty: string }) {
  const max = Math.max(...rows.map((r) => r.cents), 0);
  if (max === 0) return <p className="text-sm text-zinc-500">{empty}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[5.5rem_1fr_5rem] items-center gap-3 text-sm">
          <span className="truncate text-zinc-600 dark:text-zinc-400">{label(r.label)}</span>
          <span className="h-3 rounded-sm bg-zinc-100 dark:bg-zinc-800" aria-hidden>
            <span className="block h-3 rounded-sm bg-emerald-600" style={{ width: `${(r.cents / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">{formatCents(r.cents)}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function InsightsPage() {
  const [items, events] = await Promise.all([listItems(), listEvents()]);
  const restock = restockSuggestions(items, events);
  const monthly = spendByMonth(items, events);
  const yearSpend = monthly.reduce((n, r) => n + r.cents, 0);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Insights</h1>
        <p className="text-sm text-zinc-500">Restock suggestions come from how fast you actually use things. Every +/− and edit is logged.</p>
      </header>

      <section aria-labelledby="restock">
        <h2 id="restock" className="mb-3 text-lg font-semibold">Shopping list</h2>
        {restock.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing to restock right now.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Why</th>
                  <th className="px-4 py-2 text-right">Usage</th>
                  <th className="px-4 py-2 text-right">Buy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {restock.map((r) => (
                  <tr key={r.item.id}>
                    <td className="px-4 py-3 font-medium">{r.item.name}<div className="text-xs font-normal text-zinc-500">{r.item.quantity} on hand</div></td>
                    <td className="px-4 py-3">
                      {r.reason === "out" ? "Out of stock" : r.reason === "low" ? "Below alert level" : `Runs out in ~${Math.round(r.daysLeft ?? 0)} days`}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-500">{r.perDay > 0 ? `${(r.perDay * 30).toFixed(1)}/month` : "no history"}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{r.suggestedQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-10 md:grid-cols-2">
        <section aria-labelledby="monthly">
          <h2 id="monthly" className="mb-1 text-lg font-semibold">Spend by month</h2>
          <p className="mb-3 text-sm text-zinc-500">Last 12 months · {formatCents(yearSpend)} total · items with a purchase date and price</p>
          <Bars rows={monthly} label={monthLabel} empty="No dated purchases yet." />
        </section>
        <section aria-labelledby="category">
          <h2 id="category" className="mb-1 text-lg font-semibold">Stock value by category</h2>
          <p className="mb-3 text-sm text-zinc-500">What you currently own, at purchase price</p>
          <Bars rows={valueByCategory(items)} empty="No priced items yet." />
        </section>
      </div>
    </main>
  );
}
