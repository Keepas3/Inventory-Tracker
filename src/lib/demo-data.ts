import type { NewItem } from "@/db/schema";

/**
 * Sample inventory for the public demo: a software person's home lab, desk, workshop and kitchen.
 * Pure and deterministic for a given `now`; every date is relative to it, so the demo's alerts,
 * restock suggestions and charts stay correct when the dataset is regenerated (see the refresh cron).
 */

export interface DemoEvent {
  kind: "created" | "adjust";
  delta: number;
  /** SQLite CURRENT_TIMESTAMP format: "YYYY-MM-DD HH:MM:SS" (UTC). */
  createdAt: string;
}

export interface DemoRecord {
  item: NewItem;
  events: DemoEvent[];
}

interface Spec {
  name: string;
  category: string;
  location: string;
  /** Units originally bought. */
  bought: number;
  /** Days ago it was bought. */
  boughtAgo: number;
  /** Unit price in dollars. */
  price: number;
  /** Alert when quantity <= this (consumables). */
  min?: number;
  /** Days from now until warranty ends (negative = lapsed). */
  warranty?: number;
  /** Days from now until it expires (negative = expired). */
  expires?: number;
  notes?: string;
  /** Days ago each unit was used up. Current quantity = bought - used.length. */
  used?: number[];
}

const SPECS: Spec[] = [
  // Home lab
  { name: "Synology DS224+ NAS", category: "Home lab", location: "Home lab rack", bought: 1, boughtAgo: 262, price: 299.99, warranty: 468, notes: "Two-bay, running Plex and nightly backups." },
  { name: "WD Red Plus 8TB drive", category: "Home lab", location: "Home lab rack", bought: 2, boughtAgo: 262, price: 159.99, warranty: 833, notes: "Mirrored pair inside the NAS." },
  { name: "UniFi U6 Pro access point", category: "Home lab", location: "Ceiling, hallway", bought: 2, boughtAgo: 335, price: 149, warranty: 18, notes: "Warranty ends soon; check RMA terms before it does." },
  { name: "UniFi USW-Lite-8-PoE switch", category: "Home lab", location: "Home lab rack", bought: 1, boughtAgo: 412, price: 109, warranty: -47, notes: "Warranty lapsed." },
  { name: "Raspberry Pi 5 (8GB)", category: "Home lab", location: "Home lab shelf", bought: 2, boughtAgo: 151, price: 80, notes: "One runs Pi-hole and Home Assistant, one is a spare." },
  { name: "Beelink SER7 mini PC", category: "Home lab", location: "Home lab shelf", bought: 1, boughtAgo: 191, price: 349, warranty: 174, notes: "Proxmox host." },
  { name: "Samsung 990 Pro 2TB NVMe", category: "Home lab", location: "Home lab shelf", bought: 1, boughtAgo: 118, price: 159.99, warranty: 1708 },
  { name: "Crucial 32GB DDR5 SODIMM kit", category: "Home lab", location: "Home lab shelf", bought: 1, boughtAgo: 191, price: 94.99, warranty: 9000, notes: "Lifetime warranty." },
  { name: "APC Back-UPS 1500VA", category: "Home lab", location: "Home lab rack", bought: 1, boughtAgo: 497, price: 219.99, warranty: 245, notes: "Battery replaced last winter." },

  // Desk setup
  { name: "MacBook Pro 14\" (M3 Pro)", category: "Desk setup", location: "Office desk", bought: 1, boughtAgo: 341, price: 1999, warranty: 24, notes: "AppleCare+ ends soon." },
  { name: "LG UltraFine 27\" 4K monitor", category: "Desk setup", location: "Office desk", bought: 1, boughtAgo: 221, price: 449.99, warranty: 144 },
  { name: "Keychron Q1 keyboard", category: "Desk setup", location: "Office desk", bought: 1, boughtAgo: 281, price: 169, warranty: 84 },
  { name: "Logitech MX Master 3S mouse", category: "Desk setup", location: "Office desk", bought: 1, boughtAgo: 243, price: 99.99, warranty: 122 },
  { name: "Shure MV7 microphone", category: "Desk setup", location: "Office desk", bought: 1, boughtAgo: 121, price: 249, warranty: 244 },
  { name: "Logitech Brio 4K webcam", category: "Desk setup", location: "Office desk", bought: 1, boughtAgo: 121, price: 129.99, warranty: 244 },
  { name: "CalDigit TS4 Thunderbolt dock", category: "Desk setup", location: "Office desk", bought: 1, boughtAgo: 203, price: 399.99, warranty: 527 },
  { name: "Anker 737 charger (140W)", category: "Desk setup", location: "Office desk", bought: 2, boughtAgo: 90, price: 99.99, warranty: 640, notes: "One at the desk, one in the travel bag." },

  // Cables & adapters
  { name: "USB-C to HDMI 2.1 cable", category: "Cables & adapters", location: "Desk drawer", bought: 4, boughtAgo: 163, price: 14.99, min: 1, used: [75] },
  { name: "Cat6 Ethernet cable (3 ft)", category: "Cables & adapters", location: "Desk drawer", bought: 10, boughtAgo: 140, price: 4.99, min: 2, used: [101, 88, 60, 34] },
  { name: "Thunderbolt 4 cable (1 m)", category: "Cables & adapters", location: "Desk drawer", bought: 2, boughtAgo: 203, price: 39.99 },
  { name: "USB-C to USB-A adapter", category: "Cables & adapters", location: "Desk drawer", bought: 6, boughtAgo: 130, price: 7.99, min: 2, used: [70, 41] },

  // Tools
  { name: "iFixit Pro Tech Toolkit", category: "Tools", location: "Garage workbench", bought: 1, boughtAgo: 301, price: 74.95, warranty: 9000, notes: "Lifetime warranty." },
  { name: "Pinecil soldering iron", category: "Tools", location: "Garage workbench", bought: 1, boughtAgo: 156, price: 26.99, warranty: 209 },
  { name: "Klein MM400 multimeter", category: "Tools", location: "Garage workbench", bought: 1, boughtAgo: 188, price: 39, warranty: 9000 },
  { name: "Solder spool (63/37, 100 g)", category: "Tools", location: "Garage workbench", bought: 3, boughtAgo: 156, price: 12.5, min: 1, used: [45] },

  // Supplies
  { name: "Printer paper (500 sheets)", category: "Supplies", location: "Office closet", bought: 6, boughtAgo: 82, price: 8.99, min: 2, used: [66, 50, 33, 19, 5] },
  { name: "AA batteries (8-pack)", category: "Supplies", location: "Utility drawer", bought: 6, boughtAgo: 120, price: 10.99, min: 1, used: [100, 75, 52, 30] },
  { name: "AAA batteries (8-pack)", category: "Supplies", location: "Utility drawer", bought: 4, boughtAgo: 120, price: 9.99, min: 1, used: [58] },
  { name: "PLA filament 1 kg (Bambu)", category: "Supplies", location: "Garage shelf", bought: 9, boughtAgo: 142, price: 19.99, min: 2, used: [118, 96, 80, 55, 31, 9] },
  { name: "Velcro cable ties (50-pack)", category: "Supplies", location: "Desk drawer", bought: 3, boughtAgo: 140, price: 8.49, min: 1, used: [20] },
  { name: "Isopropyl alcohol 99% (500 ml)", category: "Supplies", location: "Garage workbench", bought: 3, boughtAgo: 110, price: 9.49, min: 1, expires: 300, used: [50] },
  { name: "Arctic MX-6 thermal paste", category: "Supplies", location: "Garage workbench", bought: 2, boughtAgo: 140, price: 7.99, used: [70] },

  // Pantry
  { name: "Coffee beans (12 oz)", category: "Pantry", location: "Kitchen pantry", bought: 8, boughtAgo: 100, price: 16.5, min: 1, used: [84, 72, 60, 48, 36, 24, 12] },
  { name: "Extra virgin olive oil (1 L)", category: "Pantry", location: "Kitchen pantry", bought: 3, boughtAgo: 95, price: 14.99, min: 1, expires: 9, used: [60, 22] },
  { name: "Coffee filters (100 ct)", category: "Pantry", location: "Kitchen pantry", bought: 3, boughtAgo: 100, price: 4.99, min: 1, used: [82, 55, 18] },
  { name: "Rolled oats (42 oz)", category: "Pantry", location: "Kitchen pantry", bought: 4, boughtAgo: 100, price: 6.49, min: 1, expires: 120, used: [70, 35] },
  { name: "Green tea bags (100 ct)", category: "Pantry", location: "Kitchen pantry", bought: 4, boughtAgo: 110, price: 9.99, min: 1, expires: 200, used: [80, 30] },
  { name: "Whey protein (2 lb)", category: "Pantry", location: "Kitchen pantry", bought: 4, boughtAgo: 130, price: 32.99, min: 1, expires: 60, used: [95, 40] },

  // Health
  { name: "Vitamin D3 (120 softgels)", category: "Health", location: "Bathroom cabinet", bought: 2, boughtAgo: 150, price: 14.99, min: 1, expires: -6, used: [85] },
  { name: "Magnesium glycinate (90 ct)", category: "Health", location: "Bathroom cabinet", bought: 3, boughtAgo: 100, price: 18.99, min: 1, expires: 14, used: [65, 30] },
  { name: "Sunscreen SPF 50", category: "Health", location: "Bathroom cabinet", bought: 2, boughtAgo: 90, price: 11.99, expires: 120, used: [40] },
];

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const stamp = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

export function buildDemoData(now: Date = new Date()): DemoRecord[] {
  const t = now.getTime();
  return SPECS.map((s) => {
    const used = s.used ?? [];
    const item: NewItem = {
      name: s.name,
      category: s.category,
      location: s.location,
      quantity: s.bought - used.length,
      minQuantity: s.min ?? 0,
      unitPriceCents: Math.round(s.price * 100),
      purchaseDate: iso(t - s.boughtAgo * DAY),
      warrantyExpires: s.warranty === undefined ? null : iso(t + s.warranty * DAY),
      expiresOn: s.expires === undefined ? null : iso(t + s.expires * DAY),
      notes: s.notes ?? null,
      // Real creation time, so "Sort: newest" means something.
      createdAt: stamp(t - s.boughtAgo * DAY),
      updatedAt: stamp(t - s.boughtAgo * DAY),
    };
    const events: DemoEvent[] = [
      { kind: "created", delta: s.bought, createdAt: stamp(t - s.boughtAgo * DAY) },
      ...used.map((ago) => ({ kind: "adjust" as const, delta: -1, createdAt: stamp(t - ago * DAY) })),
    ];
    return { item, events };
  });
}
