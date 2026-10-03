import { CheckCircle2, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { Badge, Card, EmptyState, Stat } from "@/components/ui";
import { restockSuggestions, spendByMonth, valueByCategory, type RestockSuggestion, type SpendRow } from "@/lib/analytics";
import { formatCents, totalValueCents } from "@/lib/inventory";
import { listEvents, listItems } from "@/lib/queries";

export const metadata = { title: "Insights" };
export const dynamic = "force-dynamic";

const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });

function Bars({ rows, label = (s: string) => s, empty, unit }: { rows: SpendRow[]; label?: (s: string) => string; empty: string; unit: string }) {
  const max = Math.max(...rows.map((r) => r.cents), 0);
  if (max === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} title={`${label(r.label)}: ${formatCents(r.cents)} ${unit}`} className="grid grid-cols-[7.5rem_1fr_5.5rem] items-center gap-3 text-sm">
          <span className="text-muted leading-tight">{label(r.label)}</span>
          <span className="h-3 rounded-full bg-surface-2" aria-hidden>
            <span className="block h-3 min-w-0.5 rounded-full bg-brand" style={{ width: `${(r.cents / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">{formatCents(r.cents)}</span>
        </li>
      ))}
    </ul>
  );
}

function Reason({ s }: { s: RestockSuggestion }) {
  if (s.reason === "out") return <Badge tone="danger">Out of stock</Badge>;
  if (s.reason === "low") return <Badge tone="warn">Below alert level</Badge>;
  return <Badge tone="warn">Runs out in ~{Math.max(1, Math.round(s.daysLeft ?? 0))} days</Badge>;
}

export default async function InsightsPage() {
  const [items, events] = await Promise.all([listItems(), listEvents()]);
  const restock = restockSuggestions(items, events);
  const monthly = spendByMonth(items, events);
  const yearSpend = monthly.reduce((n, r) => n + r.cents, 0);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="mt-1 text-sm text-muted">Restock suggestions come from how fast you actually use things. Every +/− and edit is logged.</p>
      </header>

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="To restock" value={String(restock.length)} icon={ShoppingCart} tone={restock.length ? "warn" : undefined} />
        <Stat label="Spent, 12 months" value={formatCents(yearSpend)} icon={Wallet} />
        <div className="col-span-2 sm:col-span-1">
          <Stat label="Stock value" value={formatCents(totalValueCents(items))} icon={TrendingUp} />
        </div>
      </section>

      <section aria-labelledby="restock">
        <h2 id="restock" className="mb-3 text-lg font-semibold">
          Shopping list
        </h2>
        {restock.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Nothing to restock" description="Everything you track is stocked well for now." />
        ) : (
          <Card className="divide-y divide-line">
            {restock.map((r) => (
              <div key={r.item.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[1.4fr_1fr_8rem_4rem]">
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.item.name}</div>
                  <div className="text-xs text-muted">{r.item.quantity} on hand</div>
                </div>
                <div className="order-3 col-span-2 sm:order-none sm:col-span-1">
                  <Reason s={r} />
                </div>
                <div className="hidden text-right text-sm tabular-nums text-muted sm:block">{r.perDay > 0 ? `${(r.perDay * 30).toFixed(1)}/month` : "no history"}</div>
                <div className="text-right">
                  <span className="text-xs text-muted sm:hidden">Buy </span>
                  <span className="text-lg font-semibold tabular-nums">{r.suggestedQty}</span>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      <div className="grid gap-10 md:grid-cols-2">
        <section aria-labelledby="monthly">
          <h2 id="monthly" className="mb-1 text-lg font-semibold">
            Spend by month
          </h2>
          <p className="mb-4 text-sm text-muted">Last 12 months, from items with a purchase date and price.</p>
          <Card className="p-4">
            <Bars rows={monthly} label={monthLabel} empty="No dated purchases yet." unit="spent" />
          </Card>
        </section>
        <section aria-labelledby="category">
          <h2 id="category" className="mb-1 text-lg font-semibold">
            Stock value by category
          </h2>
          <p className="mb-4 text-sm text-muted">What you currently own, at purchase price.</p>
          <Card className="p-4">
            <Bars rows={valueByCategory(items)} empty="No priced items yet." unit="in stock" />
          </Card>
        </section>
      </div>
    </main>
  );
}
