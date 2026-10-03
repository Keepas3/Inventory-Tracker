import { Minus, Package, Pencil, Plus, ScanLine, SearchX, TriangleAlert, Wallet } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { adjustQuantity, deleteItem } from "@/app/actions";
import { ConfirmDelete } from "@/components/confirm-delete";
import { InventoryFilters } from "@/components/inventory-filters";
import { SubmitButton } from "@/components/submit-button";
import { ToastFromQuery } from "@/components/toast-from-query";
import { Badge, buttonClass, Card, EmptyState, LinkButton, Stat } from "@/components/ui";
import type { Item } from "@/db/schema";
import { getAccess } from "@/lib/auth";
import { formatCents, getAlerts, totalValueCents, type Alert } from "@/lib/inventory";
import { getFacets, listItems, type ItemFilters } from "@/lib/queries";

export const metadata = { title: "Inventory" };

const SORTS = ["name", "newest", "quantity"] as const;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const iconBtn = "flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground sm:size-8";
const stepBtn = "flex size-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-40 sm:size-8";

function AlertBadges({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {alerts.map((a) => (
        <Badge key={a.kind} tone={a.severity === "danger" ? "danger" : "warn"}>
          {a.label}
        </Badge>
      ))}
    </div>
  );
}

function Stepper({ item, canWrite }: { item: Item; canWrite: boolean }) {
  if (!canWrite) return <span className="font-medium tabular-nums">{item.quantity}</span>;
  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label={`Quantity of ${item.name}`}>
      <form action={adjustQuantity.bind(null, item.id, -1)}>
        <SubmitButton aria-label={`Decrease ${item.name}`} disabled={item.quantity === 0} className={stepBtn}>
          <Minus className="size-4" aria-hidden />
        </SubmitButton>
      </form>
      <span className="w-8 text-center font-medium tabular-nums" aria-live="polite">
        {item.quantity}
      </span>
      <form action={adjustQuantity.bind(null, item.id, 1)}>
        <SubmitButton aria-label={`Increase ${item.name}`} className={stepBtn}>
          <Plus className="size-4" aria-hidden />
        </SubmitButton>
      </form>
    </div>
  );
}

function RowActions({ item }: { item: Item }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/items/${item.id}/edit`} aria-label={`Edit ${item.name}`} title="Edit" className={iconBtn}>
        <Pencil className="size-4" aria-hidden />
      </Link>
      <ConfirmDelete action={deleteItem.bind(null, item.id)} name={item.name} />
    </div>
  );
}

const lineValue = (item: Item) => formatCents(item.unitPriceCents === null ? null : item.unitPriceCents * item.quantity);

export default async function Inventory({ searchParams }: PageProps<"/inventory">) {
  const { canWrite } = await getAccess();
  const sp = await searchParams;
  const sort = SORTS.find((s) => s === first(sp.sort)) ?? "name";
  const filters: ItemFilters = { q: first(sp.q), category: first(sp.category), location: first(sp.location), sort };
  const filtered = Boolean(filters.q || filters.category || filters.location);

  // Stats and the attention panel describe the whole inventory; the list below respects the filters.
  const [all, list, { categories, locations }] = await Promise.all([listItems(), listItems(filters), getFacets()]);
  const rows = list.map((item) => ({ item, alerts: getAlerts(item) }));
  const attention = all.map((item) => ({ item, alerts: getAlerts(item) })).filter((r) => r.alerts.length > 0);

  const nameLink = (item: Item) =>
    canWrite ? (
      <Link href={`/items/${item.id}/edit`} className="font-medium underline-offset-2 hover:underline">
        {item.name}
      </Link>
    ) : (
      <span className="font-medium">{item.name}</span>
    );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <Suspense>
        <ToastFromQuery />
      </Suspense>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="mt-1 text-sm text-muted">Everything you own, and what needs attention.</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <LinkButton href="/scan" variant="secondary">
              <ScanLine className="size-4" aria-hidden /> Scan
            </LinkButton>
            <LinkButton href="/items/new">
              <Plus className="size-4" aria-hidden /> Add item
            </LinkButton>
          </div>
        )}
      </header>

      <section aria-label="Summary" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Stat label="Items" value={String(all.length)} icon={Package} />
        <Stat label="Total value" value={formatCents(totalValueCents(all))} icon={Wallet} />
        <div className="col-span-2 sm:col-span-1">
          <Stat label="Needs attention" value={String(attention.length)} icon={TriangleAlert} tone={attention.length ? "warn" : undefined} />
        </div>
      </section>

      {attention.length > 0 && (
        <Card className="mb-6 border-warn/30 bg-warn-soft p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-warn">
            <TriangleAlert className="size-4" aria-hidden /> Needs attention
          </h2>
          <ul className="divide-y divide-warn/15">
            {attention.slice(0, 5).map(({ item, alerts }) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm first:pt-0 last:pb-0">
                {nameLink(item)}
                <span className="flex flex-wrap gap-1.5">
                  {alerts.map((a) => (
                    <Badge key={a.kind} tone={a.severity === "danger" ? "danger" : "warn"}>
                      {a.label}
                    </Badge>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          {attention.length > 5 && (
            <details className="mt-1 text-sm">
              <summary className="cursor-pointer py-2 font-medium text-warn">Show {attention.length - 5} more</summary>
              <ul className="divide-y divide-warn/15">
                {attention.slice(5).map(({ item, alerts }) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
                    {nameLink(item)}
                    <span className="flex flex-wrap gap-1.5">
                      {alerts.map((a) => (
                        <Badge key={a.kind} tone={a.severity === "danger" ? "danger" : "warn"}>
                          {a.label}
                        </Badge>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>
      )}

      <div className="mb-3">
        <InventoryFilters categories={categories} locations={locations} q={filters.q} category={filters.category} location={filters.location} sort={sort} filtered={filtered} />
      </div>
      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {filtered ? `${rows.length} of ${all.length} items` : `${rows.length} items`}
      </p>

      {rows.length === 0 ? (
        filtered ? (
          <EmptyState icon={SearchX} title="No items match those filters" description="Try a different search, or clear the filters to see everything.">
            <Link href="/inventory" className={buttonClass("secondary")}>
              Clear filters
            </Link>
          </EmptyState>
        ) : (
          <EmptyState icon={Package} title="Nothing tracked yet" description={canWrite ? "Add your first item, or scan a receipt to add several at once." : "There are no items to show."}>
            {canWrite && (
              <div className="flex gap-2">
                <LinkButton href="/items/new">
                  <Plus className="size-4" aria-hidden /> Add item
                </LinkButton>
                <LinkButton href="/scan" variant="secondary">
                  <ScanLine className="size-4" aria-hidden /> Scan a receipt
                </LinkButton>
              </div>
            )}
          </EmptyState>
        )
      ) : (
        <>
          {/* Desktop: table */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Item</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Location</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Qty</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Value</th>
                  {canWrite && <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ item, alerts }) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      {nameLink(item)}
                      <div className="text-xs text-muted">{item.category}</div>
                      <AlertBadges alerts={alerts} />
                    </td>
                    <td className="px-4 py-3 text-muted">{item.location}</td>
                    <td className="px-4 py-3">
                      <Stepper item={item} canWrite={canWrite} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{lineValue(item)}</td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <RowActions item={item} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Phones: cards, so nothing scrolls sideways */}
          <ul className="space-y-3 md:hidden">
            {rows.map(({ item, alerts }) => (
              <li key={item.id}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate">{nameLink(item)}</div>
                      <div className="text-xs text-muted">
                        {item.category} · {item.location}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">{lineValue(item)}</span>
                  </div>
                  <AlertBadges alerts={alerts} />
                  <div className="mt-3 flex items-center justify-between">
                    <Stepper item={item} canWrite={canWrite} />
                    {canWrite && <RowActions item={item} />}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
