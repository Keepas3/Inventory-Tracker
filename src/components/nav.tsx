import Link from "next/link";

const links = [
  { href: "/", label: "Inventory" },
  { href: "/insights", label: "Insights" },
  { href: "/scan", label: "Scan" },
  { href: "/ask", label: "Ask" },
];

export function Nav() {
  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm">
        <Link href="/" className="font-semibold">
          Stockpile
        </Link>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-zinc-600 hover:text-foreground dark:text-zinc-400">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
