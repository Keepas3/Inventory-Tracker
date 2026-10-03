import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {SITE.name}
          {SITE.author ? <> · built by {SITE.portfolioUrl ? <a href={SITE.portfolioUrl} className="underline underline-offset-2 hover:text-foreground">{SITE.author}</a> : SITE.author}</> : null}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>Next.js · Drizzle · Turso · Claude</span>
          <a href={SITE.repoUrl} target="_blank" rel="noreferrer" className="font-medium text-foreground underline underline-offset-2">
            Source on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
