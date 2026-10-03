import { reseedDemo } from "../src/lib/demo-seed";

async function main() {
  // The seed wipes every table. Never let it hit a remote database by accident (e.g. a stray DATABASE_URL in the shell).
  const url = process.env.DATABASE_URL ?? "file:local.db";
  if (!url.startsWith("file:") && process.env.SEED_CONFIRM !== "yes") {
    console.error(`Refusing to wipe and seed non-local database (${new URL(url.replace(/^libsql:/, "https:")).host}).\nRe-run with SEED_CONFIRM=yes if that is really what you want.`);
    process.exit(1);
  }

  const { items, events } = await reseedDemo();
  console.log(`Seeded ${items} items and ${events} events.`);
}

main();
