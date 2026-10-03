import { db } from "../src/db";
import { itemEvents, items, type NewItem } from "../src/db/schema";

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const stamp = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 19).replace("T", " ");

// `bought` = units originally purchased (drives the created event); `used` = [daysAgo, units] consumption history.
interface Seed {
  item: NewItem;
  bought: number;
  boughtDaysAgo: number;
  used?: [number, number][];
}

const seed: Seed[] = [
  { item: { name: "MacBook Pro 14\"", category: "Electronics", location: "Office", quantity: 1, unitPriceCents: 199900, purchaseDate: daysFromNow(-200), warrantyExpires: daysFromNow(21), notes: "AppleCare+ through the date shown." }, bought: 1, boughtDaysAgo: 200 },
  { item: { name: "USB-C to HDMI cable", category: "Cables", location: "Office drawer", quantity: 2, minQuantity: 1, unitPriceCents: 1299, purchaseDate: daysFromNow(-70) }, bought: 3, boughtDaysAgo: 70, used: [[40, 1]] },
  { item: { name: "Raspberry Pi 5", category: "Electronics", location: "Home lab", quantity: 1, unitPriceCents: 8000, purchaseDate: daysFromNow(-120), warrantyExpires: daysFromNow(400) }, bought: 1, boughtDaysAgo: 120 },
  { item: { name: "Ubiquiti switch", category: "Networking", location: "Home lab", quantity: 1, unitPriceCents: 12900, purchaseDate: daysFromNow(-330), warrantyExpires: daysFromNow(-30), notes: "Warranty lapsed." }, bought: 1, boughtDaysAgo: 330 },
  { item: { name: "Olive oil", category: "Pantry", location: "Kitchen", quantity: 1, minQuantity: 1, unitPriceCents: 1100, purchaseDate: daysFromNow(-40), expiresOn: daysFromNow(12) }, bought: 3, boughtDaysAgo: 40, used: [[30, 1], [12, 1]] },
  { item: { name: "Printer paper (ream)", category: "Supplies", location: "Office closet", quantity: 1, minQuantity: 2, unitPriceCents: 899, purchaseDate: daysFromNow(-55) }, bought: 6, boughtDaysAgo: 55, used: [[45, 1], [35, 1], [25, 1], [12, 1], [4, 1]] },
  { item: { name: "AA batteries (pack)", category: "Supplies", location: "Utility drawer", quantity: 3, minQuantity: 2, unitPriceCents: 1099, purchaseDate: daysFromNow(-60) }, bought: 10, boughtDaysAgo: 60, used: [[50, 1], [44, 1], [38, 1], [29, 1], [21, 1], [14, 1], [6, 1]] },
  { item: { name: "Vitamin D", category: "Health", location: "Bathroom", quantity: 1, minQuantity: 1, unitPriceCents: 1499, purchaseDate: daysFromNow(-150), expiresOn: daysFromNow(-5) }, bought: 2, boughtDaysAgo: 150, used: [[90, 1]] },
  { item: { name: "Coffee beans (bag)", category: "Pantry", location: "Kitchen", quantity: 1, unitPriceCents: 1800, purchaseDate: daysFromNow(-90) }, bought: 8, boughtDaysAgo: 90, used: [[80, 1], [70, 1], [60, 1], [50, 1], [38, 1], [24, 1], [10, 1]] },
];

async function main() {
  // The seed wipes every table. Never let it hit a remote database by accident (e.g. a stray DATABASE_URL in the shell).
  const url = process.env.DATABASE_URL ?? "file:local.db";
  if (!url.startsWith("file:") && process.env.SEED_CONFIRM !== "yes") {
    console.error(`Refusing to wipe and seed non-local database (${new URL(url.replace(/^libsql:/, "https:")).host}).\nRe-run with SEED_CONFIRM=yes if that is really what you want.`);
    process.exit(1);
  }

  await db.delete(itemEvents);
  await db.delete(items);

  const inserted = await db.insert(items).values(seed.map((s) => s.item)).returning({ id: items.id });
  const events = inserted.flatMap(({ id }, i) => {
    const s = seed[i];
    return [
      { itemId: id, kind: "created" as const, delta: s.bought, createdAt: stamp(s.boughtDaysAgo) },
      ...(s.used ?? []).map(([ago, n]) => ({ itemId: id, kind: "adjust" as const, delta: -n, createdAt: stamp(ago) })),
    ];
  });
  await db.insert(itemEvents).values(events);
  console.log(`Seeded ${seed.length} items and ${events.length} events.`);
}

main();
