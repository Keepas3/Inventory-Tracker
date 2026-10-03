import Link from "next/link";
import { logout } from "@/app/login/actions";
import { getAccess } from "@/lib/auth";

const links = [
  { href: "/", label: "Inventory" },
  { href: "/insights", label: "Insights" },
  { href: "/scan", label: "Scan" },
  { href: "/ask", label: "Ask" },
];

export async function Nav() {
  const { policy, session } = await getAccess();
  const loggedOut = policy.kind === "login" && !session;
  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm">
        <Link href="/" className="font-semibold">
          Stockpile
        </Link>
        {!loggedOut &&
          links.map((l) => (
            <Link key={l.href} href={l.href} className="text-zinc-600 hover:text-foreground dark:text-zinc-400">
              {l.label}
            </Link>
          ))}
        <div className="ml-auto flex items-center gap-3">
          {policy.kind === "demo" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">Demo · read-only</span>
          )}
          {policy.kind === "login" && session && (
            <form action={logout}>
              <button className="text-zinc-600 hover:text-foreground dark:text-zinc-400">Sign out</button>
            </form>
          )}
        </div>
      </div>
    </nav>
  );
}
