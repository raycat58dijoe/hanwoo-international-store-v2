import { SEED_PRODUCTS } from "./seed";
import type { Order, Product } from "./types";

const CONNECTION_STRING = process.env.POSTGRES_URL;
const USE_DB = Boolean(CONNECTION_STRING);

/* ---------- in-memory store ---------- */
let memProducts: Product[] | null = null;
let memOrders: Order[] = [];

function memEnsure(): Product[] {
  if (!memProducts) memProducts = SEED_PRODUCTS.map((p) => ({ ...p, images: [...p.images] }));
  return memProducts;
}

/* ---------- lazy-load Neon client ---------- */
let _neonClient: any = null;
async function getNeon(): Promise<any> {
  if (!_neonClient && USE_DB) {
    // Dynamic import — loaded only at runtime when POSTGRES_URL is set.
    // Using a variable prevents any bundler from resolving this at build time.
    const modName = "./neon-client";
    _neonClient = await import(modName);
  }
  return _neonClient;
}

/* ---------- row mappers ---------- */
function rowToProduct(r: any): Product {
  const images = typeof r.images === "string" ? JSON.parse(r.images) : Array.isArray(r.images) ? r.images : [];
  return { id: r.id, slug: r.slug, name: { en: r.name_en, zh: r.name_zh }, description: { en: r.description_en, zh: r.description_zh }, priceUSD: Number(r.price_usd), images, category: r.category, inventory: Number(r.inventory), featured: r.featured, active: r.active };
}
function rowToOrder(r: any): Order {
  return { id: r.id, items: typeof r.items === "string" ? JSON.parse(r.items) : r.items || [], amountUSD: Number(r.amount_usd), currency: r.currency, customer: typeof r.customer === "string" ? JSON.parse(r.customer) : r.customer, status: r.status, stripeSessionId: r.stripe_session_id ?? undefined, createdAt: r.created_at };
}

/* ---------- products ---------- */
export async function getProducts(): Promise<Product[]> {
  if (!USE_DB) return memEnsure().filter((p) => p.active);
  const neon = await getNeon();
  return (await neon.query("SELECT * FROM products WHERE active = TRUE")).map(rowToProduct);
}
export async function getAllProducts(): Promise<Product[]> {
  if (!USE_DB) return memEnsure();
  const neon = await getNeon();
  return (await neon.query("SELECT * FROM products")).map(rowToProduct);
}
export async function getProductById(id: string): Promise<Product | undefined> {
  if (!USE_DB) return memEnsure().find((p) => p.id === id);
  const neon = await getNeon();
  const rows = await neon.query("SELECT * FROM products WHERE id = $1", [id]);
  return rows[0] ? rowToProduct(rows[0]) : undefined;
}
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (!USE_DB) return memEnsure().find((p) => p.slug === slug);
  const neon = await getNeon();
  const rows = await neon.query("SELECT * FROM products WHERE slug = $1", [slug]);
  return rows[0] ? rowToProduct(rows[0]) : undefined;
}
export async function upsertProduct(p: Product): Promise<Product[]> {
  if (!USE_DB) { const list = memEnsure(); const i = list.findIndex((x) => x.id === p.id); if (i >= 0) list[i] = p; else list.push(p); return list; }
  const neon = await getNeon();
  await neon.query(`INSERT INTO products (id,slug,name_en,name_zh,description_en,description_zh,price_usd,images,category,inventory,featured,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug,name_en=EXCLUDED.name_en,name_zh=EXCLUDED.name_zh,description_en=EXCLUDED.description_en,description_zh=EXCLUDED.description_zh,price_usd=EXCLUDED.price_usd,images=EXCLUDED.images,category=EXCLUDED.category,inventory=EXCLUDED.inventory,featured=EXCLUDED.featured,active=EXCLUDED.active`, [p.id, p.slug, p.name.en, p.name.zh, p.description.en, p.description.zh, p.priceUSD, JSON.stringify(p.images), p.category, p.inventory, p.featured, p.active]);
  return getAllProducts();
}
export async function deleteProduct(id: string): Promise<Product[]> {
  if (!USE_DB) { memProducts = memEnsure().filter((x) => x.id !== id); return memProducts!; }
  const neon = await getNeon();
  await neon.query("DELETE FROM products WHERE id = $1", [id]);
  return getAllProducts();
}

/* ---------- orders ---------- */
export async function createOrder(o: Order): Promise<Order> {
  if (!USE_DB) { memOrders.push(o); return o; }
  const neon = await getNeon();
  await neon.query(`INSERT INTO orders (id,items,amount_usd,currency,customer,status,stripe_session_id,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [o.id, JSON.stringify(o.items), o.amountUSD, o.currency, JSON.stringify(o.customer), o.status, o.stripeSessionId ?? null, o.createdAt]);
  return o;
}
export async function getOrder(id: string): Promise<Order | undefined> {
  if (!USE_DB) return memOrders.find((o) => o.id === id);
  const neon = await getNeon();
  const rows = await neon.query("SELECT * FROM orders WHERE id = $1", [id]);
  return rows[0] ? rowToOrder(rows[0]) : undefined;
}
export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined> {
  if (!USE_DB) { const i = memOrders.findIndex((o) => o.id === id); if (i < 0) return undefined; memOrders[i] = { ...memOrders[i], ...patch }; return memOrders[i]; }
  const neon = await getNeon();
  const sets: string[] = []; const vals: any[] = []; let n = 1;
  if (patch.status !== undefined) { sets.push("status=$" + n++); vals.push(patch.status); }
  if (patch.stripeSessionId !== undefined) { sets.push("stripe_session_id=$" + n++); vals.push(patch.stripeSessionId); }
  if (sets.length === 0) return getOrder(id);
  await neon.query("UPDATE orders SET " + sets.join(",") + " WHERE id=$" + n, [...vals, id]);
  return getOrder(id);
}

export function genId(prefix: string): string {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
