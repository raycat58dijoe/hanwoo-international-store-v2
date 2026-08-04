import { SEED_PRODUCTS } from "./seed";
import type { Order, Product } from "./types";

const CONNECTION_STRING = process.env.POSTGRES_URL;
const USE_DB = Boolean(CONNECTION_STRING);

/* ---------- in-memory store (always available) ---------- */
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
    try {
      const modName = "./neon-client";
      _neonClient = await import(modName);
    } catch {
      // Import failed (build-time SSG, bundler resolution, etc.)
      // Return null so caller falls back to in-memory.
      // Do NOT cache failure — next request in a real server environment may succeed.
      return null;
    }
  }
  return _neonClient;
}

/* ---------- row mappers ---------- */
function rowToProduct(r: any): Product {
  const images = typeof r.images === "string" ? JSON.parse(r.images) : Array.isArray(r.images) ? r.images : [];
  return { id: r.id, slug: r.slug, name: { en: r.name_en, zh: r.name_zh }, description: { en: r.description_en, zh: r.description_zh }, priceUSD: Number(r.price_usd), images, category: r.category, inventory: Number(r.inventory), featured: r.featured, active: r.active };
}
function rowToOrder(r: any): Order {
  return { id: r.id, items: typeof r.items === "string" ? JSON.parse(r.items) : r.items || [], amountUSD: Number(r.amount_usd), currency: r.currency, customer: typeof r.customer === "string" ? JSON.parse(r.customer) : r.customer, status: r.status, paymentMethod: (r.payment_method as Order["paymentMethod"]) || "stripe", zelleConfirmed: Boolean(r.zelle_confirmed), stripeSessionId: r.stripe_session_id ?? undefined, createdAt: r.created_at };
}

/* ---------- products ---------- */
export async function getProducts(): Promise<Product[]> {
  const neon = await getNeon();
  if (!neon) return memEnsure().filter((p) => p.active);
  try { return (await neon.queryWithSchema("SELECT * FROM products WHERE active = TRUE")).map(rowToProduct); }
  catch { return memEnsure().filter((p) => p.active); }
}
export async function getAllProducts(): Promise<Product[]> {
  const neon = await getNeon();
  if (!neon) return memEnsure();
  try { return (await neon.queryWithSchema("SELECT * FROM products")).map(rowToProduct); }
  catch { return memEnsure(); }
}
export async function getProductById(id: string): Promise<Product | undefined> {
  const neon = await getNeon();
  if (!neon) return memEnsure().find((p) => p.id === id);
  try { const rows = await neon.queryWithSchema("SELECT * FROM products WHERE id = $1", [id]); return rows[0] ? rowToProduct(rows[0]) : undefined; }
  catch { return memEnsure().find((p) => p.id === id); }
}
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const neon = await getNeon();
  if (!neon) return memEnsure().find((p) => p.slug === slug);
  try { const rows = await neon.queryWithSchema("SELECT * FROM products WHERE slug = $1", [slug]); return rows[0] ? rowToProduct(rows[0]) : undefined; }
  catch { return memEnsure().find((p) => p.slug === slug); }
}
export async function upsertProduct(p: Product): Promise<Product[]> {
  const neon = await getNeon();
  if (!neon) { const list = memEnsure(); const i = list.findIndex((x) => x.id === p.id); if (i >= 0) list[i] = p; else list.push(p); return list; }
  try {
    await neon.queryWithSchema(`INSERT INTO products (id,slug,name_en,name_zh,description_en,description_zh,price_usd,images,category,inventory,featured,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug,name_en=EXCLUDED.name_en,name_zh=EXCLUDED.name_zh,description_en=EXCLUDED.description_en,description_zh=EXCLUDED.description_zh,price_usd=EXCLUDED.price_usd,images=EXCLUDED.images,category=EXCLUDED.category,inventory=EXCLUDED.inventory,featured=EXCLUDED.featured,active=EXCLUDED.active`, [p.id, p.slug, p.name.en, p.name.zh, p.description.en, p.description.zh, p.priceUSD, JSON.stringify(p.images), p.category, p.inventory, p.featured, p.active]);
    return getAllProducts();
  } catch { return upsertProduct(p); }
}
export async function deleteProduct(id: string): Promise<Product[]> {
  const neon = await getNeon();
  if (!neon) { memProducts = memEnsure().filter((x) => x.id !== id); return memProducts!; }
  try { await neon.queryWithSchema("DELETE FROM products WHERE id = $1", [id]); return getAllProducts(); }
  catch { return deleteProduct(id); }
}

/* ---------- orders ---------- */
export async function createOrder(o: Order): Promise<Order> {
  const neon = await getNeon();
  if (!neon) { memOrders.push(o); return o; }
  try { await neon.queryWithSchema(`INSERT INTO orders (id,items,amount_usd,currency,customer,status,payment_method,zelle_confirmed,stripe_session_id,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [o.id, JSON.stringify(o.items), o.amountUSD, o.currency, JSON.stringify(o.customer), o.status, o.paymentMethod ?? "stripe", o.zelleConfirmed ?? false, o.stripeSessionId ?? null, o.createdAt]); return o; }
  catch { return createOrder(o); }
}

export async function getAllOrders(): Promise<Order[]> {
  const neon = await getNeon();
  if (!neon) return memOrders.slice().reverse();
  try { return (await neon.queryWithSchema("SELECT * FROM orders ORDER BY created_at DESC")).map(rowToOrder); }
  catch { return memOrders.slice().reverse(); }
}
export async function getOrder(id: string): Promise<Order | undefined> {
  const neon = await getNeon();
  if (!neon) return memOrders.find((o) => o.id === id);
  try { const rows = await neon.queryWithSchema("SELECT * FROM orders WHERE id = $1", [id]); return rows[0] ? rowToOrder(rows[0]) : undefined; }
  catch { return memOrders.find((o) => o.id === id); }
}
export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined> {
  const neon = await getNeon();
  if (!neon) { const i = memOrders.findIndex((o) => o.id === id); if (i < 0) return undefined; memOrders[i] = { ...memOrders[i], ...patch }; return memOrders[i]; }
  try {
    const sets: string[] = []; const vals: any[] = []; let n = 1;
    if (patch.status !== undefined) { sets.push("status=$" + n++); vals.push(patch.status); }
    if (patch.stripeSessionId !== undefined) { sets.push("stripe_session_id=$" + n++); vals.push(patch.stripeSessionId); }
    if (patch.zelleConfirmed !== undefined) { sets.push("zelle_confirmed=$" + n++); vals.push(patch.zelleConfirmed); }
    if (sets.length === 0) return getOrder(id);
    await neon.queryWithSchema("UPDATE orders SET " + sets.join(",") + " WHERE id=$" + n, [...vals, id]);
    return getOrder(id);
  } catch { return updateOrder(id, patch); }
}

export function genId(prefix: string): string {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
