import { LogOut } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { getAccess } from "@/lib/auth";
import { Logo } from "./logo";
import { NavLinks, type NavItem } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "./ui";

const links: NavItem[] = [
  { href: "/", label: "Inventory" },
  { href: "/insights", label: "Insights" },
  { href: "/scan", label: "Scan" },
  { href: "/ask", label: "Ask" },
];

export async function Nav() {
  const { policy, session } = await getAccess();
  const loggedOut = policy.kind === "login" && !session;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link href="/" aria-label="Stockpile home" className="rounded-lg">
          <Logo />
        </Link>
        {!loggedOut && <NavLinks links={links} variant="inline" />}
        <div className="ml-auto flex items-center gap-1">
          {policy.kind === "demo" && <Badge tone="warn">Demo · read-only</Badge>}
          <ThemeToggle />
          {policy.kind === "login" && session && (
            <form action={logout}>
              <button
                aria-label="Sign out"
                title="Sign out"
                className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </form>
          )}
        </div>
      </div>
      {!loggedOut && <NavLinks links={links} variant="tabs" />}
    </header>
  );
}
