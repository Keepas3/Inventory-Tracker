import Link from "next/link";
import { adjustQuantity, deleteItem } from "@/app/actions";
import { getAccess } from "@/lib/auth";
import { formatCents, getAlerts, totalValueCents } from "@/lib/inventory";
import { getFacets, listItems, type ItemFilters } from "@/lib/queries";

const SORTS = ["name", "newest", "quantity"] as const;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

const control = "rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700";
const badge = {
  danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

export default async function Dashboard({ searchParams }: PageProps<"/">) {
  const { canWrite } = await getAccess();
  const sp = await searchParams;
  const sort = SORTS.find((s) => s === first(sp.sort));
  const filters: ItemFilters = { q: first(sp.q), category: first(sp.category), location: first(sp.location), sort };

  const [list, { categories, locations }] = await Promise.all([listItems(filters), getFacets()]);
  const withAlerts = list.map((item) => ({ item, alerts: getAlerts(item) }));
  const attention = withAlerts.filter((r) => r.alerts.length > 0);
  const filtered = Boolean(filters.q || filters.category || filters.location);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Stockpile</h1>
          <p className="text-sm text-zinc-500">Everything you own, and what needs attention.</p>
        </div>
        {canWrite && (
          <Link href="/items/new" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            + Add item
          </Link>
        )}
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Items" value={String(list.length)} />
        <Stat label="Total value" value={formatCents(totalValueCents(list))} />
        <Stat label="Needs attention" value={String(attention.length)} tone={attention.length ? "warn" : undefined} />
      </section>

      {attention.length > 0 && (
        <section className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <h2 className="mb-2 text-sm font-semibold">Needs attention</h2>
          <ul className="space-y-1 text-sm">
            {attention.map(({ item, alerts }) => (
              <li key={item.id}>
                {canWrite ? (
                  <Link href={`/items/${item.id}/edit`} className="font-medium underline-offset-2 hover:underline">
                    {item.name}
                  </Link>
                ) : (
                  <span className="font-medium">{item.name}</span>
                )}{" "}
                — {alerts.map((a) => a.label).join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <form className="mb-4 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={filters.q} placeholder="Search name or notes…" aria-label="Search" className={`${control} min-w-48 flex-1`} />
        <select name="category" defaultValue={filters.category ?? ""} aria-label="Category" className={control}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="location" defaultValue={filters.location ?? ""} aria-label="Location" className={control}>
          <option value="">All locations</option>
          {locations.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select name="sort" defaultValue={sort ?? "name"} aria-label="Sort" className={control}>
          <option value="name">Sort: name</option>
          <option value="newest">Sort: newest</option>
          <option value="quantity">Sort: lowest qty</option>
        </select>
        <button className={control}>Apply</button>
        {filtered && <Link href="/" className={`${control} text-zinc-500`}>Clear</Link>}
      </form>

      {withAlerts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          {filtered ? "No items match those filters." : "No items yet. Add your first one."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2 text-right">Value</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {withAlerts.map(({ item, alerts }) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.category}</div>
                    {alerts.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {alerts.map((a) => (
                          <span key={a.kind} className={`rounded-full px-2 py-0.5 text-xs ${badge[a.severity]}`}>
                            {a.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.location}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {canWrite && (
                        <form action={adjustQuantity.bind(null, item.id, -1)}>
                          <button aria-label={`Decrease ${item.name}`} className="h-6 w-6 rounded border border-zinc-300 dark:border-zinc-700">−</button>
                        </form>
                      )}
                      <span className="w-6 text-center tabular-nums">{item.quantity}</span>
                      {canWrite && (
                        <form action={adjustQuantity.bind(null, item.id, 1)}>
                          <button aria-label={`Increase ${item.name}`} className="h-6 w-6 rounded border border-zinc-300 dark:border-zinc-700">+</button>
                        </form>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCents(item.unitPriceCents === null ? null : item.unitPriceCents * item.quantity)}</td>
                  <td className="px-4 py-3">
                    {canWrite && (
                      <div className="flex justify-end gap-3 text-xs">
                        <Link href={`/items/${item.id}/edit`} className="text-emerald-700 hover:underline dark:text-emerald-400">Edit</Link>
                        <form action={deleteItem.bind(null, item.id)}>
                          <button className="text-red-600 hover:underline">Delete</button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-xs uppercase text-zinc-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone === "warn" ? "text-amber-600" : ""}`}>{value}</div>
    </div>
  );
}
