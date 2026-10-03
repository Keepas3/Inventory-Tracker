import { db } from "../src/db";
import { items, type NewItem } from "../src/db/schema";

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const seed: NewItem[] = [
  { name: "MacBook Pro 14\"", category: "Electronics", location: "Office", quantity: 1, unitPriceCents: 199900, purchaseDate: "2024-03-10", warrantyExpires: daysFromNow(21), notes: "AppleCare+ through the date shown." },
  { name: "USB-C to HDMI cable", category: "Cables", location: "Office drawer", quantity: 2, minQuantity: 1, unitPriceCents: 1299 },
  { name: "Raspberry Pi 5", category: "Electronics", location: "Home lab", quantity: 1, unitPriceCents: 8000, purchaseDate: "2025-01-15", warrantyExpires: daysFromNow(400) },
  { name: "Ubiquiti switch", category: "Networking", location: "Home lab", quantity: 1, unitPriceCents: 12900, warrantyExpires: daysFromNow(-30), notes: "Warranty lapsed." },
  { name: "Olive oil", category: "Pantry", location: "Kitchen", quantity: 1, minQuantity: 1, unitPriceCents: 1100, expiresOn: daysFromNow(12) },
  { name: "Printer paper (ream)", category: "Supplies", location: "Office closet", quantity: 1, minQuantity: 2, unitPriceCents: 899 },
  { name: "AA batteries (pack)", category: "Supplies", location: "Utility drawer", quantity: 4, minQuantity: 2, unitPriceCents: 1099 },
  { name: "Vitamin D", category: "Health", location: "Bathroom", quantity: 1, minQuantity: 1, unitPriceCents: 1499, expiresOn: daysFromNow(-5) },
];

async function main() {
  await db.delete(items);
  await db.insert(items).values(seed);
  console.log(`Seeded ${seed.length} items.`);
}

main();
