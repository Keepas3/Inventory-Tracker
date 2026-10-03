"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

/** `inline`: desktop links in the header row. `tabs`: a second row for phones, so every page stays one tap away. */
export function NavLinks({ links, variant }: { links: NavItem[]; variant: "inline" | "tabs" }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  const item = (l: NavItem) => {
    const active = isActive(l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className={
          variant === "inline"
            ? `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${active ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground"}`
            : `flex-1 border-b-2 py-2.5 text-center text-sm font-medium transition-colors ${active ? "border-brand text-foreground" : "border-transparent text-muted"}`
        }
      >
        {l.label}
      </Link>
    );
  };

  return variant === "inline" ? (
    <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
      {links.map(item)}
    </nav>
  ) : (
    <nav aria-label="Main (mobile)" className="flex border-t border-line sm:hidden">
      {links.map(item)}
    </nav>
  );
}
