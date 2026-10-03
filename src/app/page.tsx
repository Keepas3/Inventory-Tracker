import { ArrowRight, Code, MessageSquareText, Package, ScanLine, TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, buttonClass, Card, LinkButton, Stat } from "@/components/ui";
import { getAccess } from "@/lib/auth";
import { formatCents, getAlerts, totalValueCents } from "@/lib/inventory";
import { listItems } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

const features = [
  {
    href: "/scan",
    icon: ScanLine,
    title: "Scan receipts and shelves",
    body: "Snap a photo and Claude turns it into structured inventory: names, quantities, prices, dates. Nothing is saved until you review and confirm it.",
  },
  {
    href: "/ask",
    icon: MessageSquareText,
    title: "Ask in plain English",
    body: "“Do I have a spare HDMI cable?” The answer comes from read-only tool calls against the real database, so it can't make things up.",
  },
  {
    href: "/insights",
    icon: TrendingUp,
    title: "Restock before you run out",
    body: "Every +/− is logged. Usage rates drive a shopping list that predicts when each consumable runs out, plus spend charts and a weekly digest.",
  },
];

const built = [
  "Next.js App Router with Server Actions, Drizzle ORM and Turso (libSQL)",
  "Claude vision with schema-validated structured output, re-checked server-side before anything is saved",
  "Tool-use Q&A: the model can only read, through a handful of narrow query tools",
  "Two deployment modes (private login or public read-only demo), enforced in the proxy and again in every server action",
  "Per-visitor rate limits plus a global daily cap on AI calls",
  "CI on every push: lint, typecheck, unit tests, production build and dependency audit",
];

export default async function Landing() {
  const { policy } = await getAccess();
  // The intro is for the public demo. A private deployment goes straight to the owner's inventory.
  if (policy.kind !== "demo") redirect("/inventory");

  const items = await listItems();
  const flagged = items.map((item) => ({ item, alerts: getAlerts(item) })).filter((r) => r.alerts.length > 0);

  return (
    <main className="w-full">
      <section className="bg-linear-to-b from-brand-soft to-transparent">
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-16 sm:pt-24">
          <Badge tone="brand" className="mb-5">
            Portfolio project · live demo
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Know what you own, and what to restock before it runs out.</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            {SITE.name} is an AI-assisted inventory tracker I built to run my own home lab, desk and kitchen. This is a read-only demo with sample data, so explore freely.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/inventory" size="lg" className="w-full sm:w-auto">
              Try the demo <ArrowRight className="size-4" aria-hidden />
            </LinkButton>
            <a href={SITE.repoUrl} target="_blank" rel="noreferrer" className={buttonClass("secondary", "lg", "w-full sm:w-auto")}>
              <Code className="size-4" aria-hidden /> View source
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl space-y-16 px-4 pb-20">
        <section aria-labelledby="preview">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="preview" className="text-xl font-semibold tracking-tight">
                Right now in the demo
              </h2>
              <p className="text-sm text-muted">Live numbers from the sample database.</p>
            </div>
            <Link href="/inventory" className="shrink-0 text-sm font-medium text-brand-text hover:underline">
              Open inventory →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Items tracked" value={String(items.length)} icon={Package} />
            <Stat label="Total value" value={formatCents(totalValueCents(items))} icon={Wallet} />
            <Stat label="Need attention" value={String(flagged.length)} icon={TriangleAlert} tone={flagged.length ? "warn" : undefined} />
          </div>
          {flagged.length > 0 && (
            <Card className="mt-4 divide-y divide-line">
              {flagged.slice(0, 4).map(({ item, alerts }) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="flex flex-wrap gap-1.5">
                    {alerts.map((a) => (
                      <Badge key={a.kind} tone={a.severity === "danger" ? "danger" : "warn"}>
                        {a.label}
                      </Badge>
                    ))}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </section>

        <section aria-labelledby="features">
          <h2 id="features" className="mb-4 text-xl font-semibold tracking-tight">
            What it does
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(({ href, icon: Icon, title, body }) => (
              <Link key={href} href={href} className="group rounded-xl">
                <Card className="h-full p-5 transition-colors group-hover:bg-surface-2">
                  <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-text">
                    Try it <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="built" className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 id="built" className="mb-4 text-xl font-semibold tracking-tight">
              How it&apos;s built
            </h2>
            <ul className="space-y-3 text-sm leading-relaxed text-muted">
              {built.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              {SITE.stack.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </div>
          <Card className="self-start p-5">
            <h3 className="font-semibold">About this demo</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>The data is fictional and regenerated every day, so the dates and alerts stay current.</li>
              <li>Everything is read-only; nothing you do here is saved.</li>
              <li>The AI features call a real model. They&apos;re rate-limited and capped per day, so they may occasionally say they&apos;re busy.</li>
            </ul>
          </Card>
        </section>
      </div>
    </main>
  );
}
