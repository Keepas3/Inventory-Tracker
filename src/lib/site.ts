/** Site-wide constants. Author name and portfolio link are optional and omitted from the UI when unset. */
export const SITE = {
  name: "Stockpile",
  tagline: "An AI-assisted inventory tracker",
  description: "Track what you own, scan receipts with AI, ask questions in plain English, and know what to restock before it runs out.",
  repoUrl: "https://github.com/Keepas3/Inventory-Tracker",
  author: process.env.NEXT_PUBLIC_AUTHOR_NAME || undefined,
  portfolioUrl: process.env.NEXT_PUBLIC_PORTFOLIO_URL || undefined,
  stack: ["Next.js 16", "TypeScript", "Tailwind CSS", "Drizzle ORM", "Turso (libSQL)", "Claude API", "Vitest"],
} as const;

/** Absolute base URL for share-card metadata: the production domain on Vercel, localhost in dev. */
export function siteUrl(): URL {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(host ? `https://${host}` : "http://localhost:3000");
}
