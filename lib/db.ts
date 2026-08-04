import fs from "fs";
import path from "path";
import { SEED_PRODUCTS, SEED_VERSION } from "./seed";
import type { DBShape, Order, Product } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

// In-memory fallback when file is locked (sandbox env issue)
let memStore: DBShape | null = null;

function ensureStore(): DBShape {
  // Try file-based first
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      try {
        const initial: DBShape = { version: SEED_VERSION, products: SEED_PRODUCTS, orders: [] };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
        return initial;
      } catch {
        // File write blocked — use memory
        memStore = { version: SEED_VERSION, products: SEED_PRODUCTS, orders: [] };
        return memStore;
      }
    }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as DBShape;
    if (!parsed.products) parsed.products = SEED_PRODUCTS;
    if (!parsed.orders) parsed.orders = [];
    // If stored data version doesn't match current seed, reseed
    if (parsed.version !== SEED_VERSION) {
      console.log(`[db] Stored data v${parsed.version} != seed v${SEED_VERSION} — reseeding`);
      parsed.products = SEED_PRODUCTS;
      parsed.version = SEED_VERSION;
    }
    return parsed;
  } catch {
    // File read blocked — seed from code
    if (!memStore) memStore = { version: SEED_VERSION, products: SEED_PRODUCTS, orders: [] };
    return memStore;
  }
}

// Serialize writes to avoid corruption from concurrent requests.
let writeChain: Promise<void> = Promise.resolve();

function persist(data: DBShape): Promise<void> {
  memStore = data; // always keep memory in sync
  writeChain = writeChain.then(
    () =>
      new Promise<void>((resolve) => {
        fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), () => resolve());
      })
  );
  return writeChain;
}

export function getProducts(): Product[] {
  return ensureStore().products.filter((p) => p.active);
}

export function getAllProducts(): Product[] {
  return ensureStore().products;
}

export function getProductById(id: string): Product | undefined {
  return ensureStore().products.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return ensureStore().products.find((p) => p.slug === slug);
}

export function upsertProduct(p: Product): Product[] {
  const db = ensureStore();
  const idx = db.products.findIndex((x) => x.id === p.id);
  if (idx >= 0) db.products[idx] = p;
  else db.products.push(p);
  persist(db);
  return db.products;
}

export function deleteProduct(id: string): Product[] {
  const db = ensureStore();
  db.products = db.products.filter((x) => x.id !== id);
  persist(db);
  return db.products;
}

export function createOrder(o: Order): Order {
  const db = ensureStore();
  db.orders.push(o);
  persist(db);
  return o;
}

export function getOrder(id: string): Order | undefined {
  return ensureStore().orders.find((o) => o.id === id);
}

export function updateOrder(id: string, patch: Partial<Order>): Order | undefined {
  const db = ensureStore();
  const idx = db.orders.findIndex((o) => o.id === id);
  if (idx < 0) return undefined;
  db.orders[idx] = { ...db.orders[idx], ...patch };
  persist(db);
  return db.orders[idx];
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
