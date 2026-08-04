import { SEED_PRODUCTS } from "./seed";
import type { Order, Product } from "./types";

/**
 * Real database layer (Postgres via Neon serverless driver).
 *
 * - When POSTGRES_URL is set we read/write a real Postgres database.
 * - When it is NOT set (e.g. local preview without DB) we fall back to an
 *   in-memory copy of the seed data so the UI still works.
 *
 * Uses @neondatabase/serverless — a pure-JS driver built for Vercel /
 * edge / serverless. No native dependencies, no build-time resolution
 * issues.
 */

const CONNECTION_STRING = process.env.POSTGRES_URL;
const USE_DB = Boolean(CONNECTION_STRING);

/* eslint-disable @typescript-eslint/no-explicit-any */
let _sql: any = null;
async function db(): Promise<any> {
  if (!USE_DB) throw new Error("POSTGRES_URL is not configured");
  if (!_sql) {
    // Dynamic import via variable — prevents any bundler from resolving
    // this at build time. @neondatabase/serverless is pure JS (no native
    // deps), so it works on Vercel / edge out of the box.
    const _driver = "@neondatabase/serverless";
    const neon = (await import(_driver)).neon;
    _sql = neon(CONNECTION_STRING as string);
  }
  return _sql;
}

/* ---------- in-memory fallback ---------- */
let memProducts: Product[] | null = null;
let memOrders: Order[] = [];

function memEnsure(): Product[] {
  if (!memProducts) {
    memProducts = SEED_PRODUCTS.map((p) => ({ ...p, images: [...p.images] }));
  }
  return memProducts;
}

/* ---------- schema bootstrap ---------- */
let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = await db();
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          name_en TEXT NOT NULL,
          name_zh TEXT NOT NULL,
          description_en TEXT NOT NULL DEFAULT '',
          description_zh TEXT NOT NULL DEFAULT '',
          price_usd NUMERIC(10,2) NOT NULL,
          images JSONB NOT NULL DEFAULT '[]'::jsonb,
          category TEXT NOT NULL DEFAULT 'General',
          inventory INTEGER NOT NULL DEFAULT 0,
          featured BOOLEAN NOT NULL DEFAULT FALSE,
          active BOOLEAN NOT NULL DEFAULT TRUE
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          amount_usd NUMERIC(10,2) NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          customer JSONB NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          stripe_session_id TEXT,
          created_at TEXT NOT NULL
        )
      `;
      const rows = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM products`;
      if (rows[0].count === 0) {
        for (const p of SEED_PRODUCTS) {
          await sql`
            INSERT INTO products
              (id, slug, name_en, name_zh, description_en, description_zh,
               price_usd, images, category, inventory, featured, active)
            VALUES
              (${p.id}, ${p.slug}, ${p.name.en}, ${p.name.zh},
               ${p.description.en}, ${p.description.zh}, ${p.priceUSD},
               ${sql.json(p.images)}, ${p.category}, ${p.inventory},
               ${p.featured}, ${p.active})
            ON CONFLICT (id) DO NOTHING
          `;
        }
        console.log(`[db] Seeded ${SEED_PRODUCTS.length} products`);
      }
    })().catch((e: any) => {
      schemaReady = null; // allow retry on next call
      throw e;
    });
  }
  return schemaReady;
}

/* ---------- row mappers ---------- */
function rowToProduct(r: any): Product {
  const images =
    typeof r.images === "string"
      ? JSON.parse(r.images)
      : Array.isArray(r.images)
      ? r.images
      : [];
  return {
    id: r.id,
    slug: r.slug,
    name: { en: r.name_en, zh: r.name_zh },
    description: { en: r.description_en, zh: r.description_zh },
    priceUSD: Number(r.price_usd),
    images,
    category: r.category,
    inventory: Number(r.inventory),
    featured: r.featured,
    active: r.active,
  };
}

function rowToOrder(r: any): Order {
  return {
    id: r.id,
    items: typeof r.items === "string" ? JSON.parse(r.items) : r.items || [],
    amountUSD: Number(r.amount_usd),
    currency: r.currency,
    customer:
      typeof r.customer === "string" ? JSON.parse(r.customer) : r.customer,
    status: r.status,
    stripeSessionId: r.stripe_session_id ?? undefined,
    createdAt: r.created_at,
  };
}

/* ---------- products ---------- */
export async function getProducts(): Promise<Product[]> {
  if (!USE_DB) return memEnsure().filter((p) => p.active);
  await ensureSchema();
  const sql = await db();
  const rows = await sql<Product[]>`SELECT * FROM products WHERE active = TRUE`;
  return rows.map(rowToProduct);
}

export async function getAllProducts(): Promise<Product[]> {
  if (!USE_DB) return memEnsure();
  await ensureSchema();
  const sql = await db();
  const rows = await sql<Product[]>`SELECT * FROM products`;
  return rows.map(rowToProduct);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (!USE_DB) return memEnsure().find((p) => p.id === id);
  await ensureSchema();
  const sql = await db();
  const rows = await sql<Product[]>`SELECT * FROM products WHERE id = ${id}`;
  return rows[0] ? rowToProduct(rows[0]) : undefined;
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  if (!USE_DB) return memEnsure().find((p) => p.slug === slug);
  await ensureSchema();
  const sql = await db();
  const rows = await sql<Product[]>`SELECT * FROM products WHERE slug = ${slug}`;
  return rows[0] ? rowToProduct(rows[0]) : undefined;
}

export async function upsertProduct(p: Product): Promise<Product[]> {
  if (!USE_DB) {
    const list = memEnsure();
    const idx = list.findIndex((x) => x.id === p.id);
    if (idx >= 0) list[idx] = p;
    else list.push(p);
    return list;
  }
  await ensureSchema();
  const sql = await db();
  await sql`
    INSERT INTO products
      (id, slug, name_en, name_zh, description_en, description_zh,
       price_usd, images, category, inventory, featured, active)
    VALUES
      (${p.id}, ${p.slug}, ${p.name.en}, ${p.name.zh},
       ${p.description.en}, ${p.description.zh}, ${p.priceUSD},
       ${sql.json(p.images)}, ${p.category}, ${p.inventory},
       ${p.featured}, ${p.active})
    ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug,
      name_en = EXCLUDED.name_en,
      name_zh = EXCLUDED.name_zh,
      description_en = EXCLUDED.description_en,
      description_zh = EXCLUDED.description_zh,
      price_usd = EXCLUDED.price_usd,
      images = EXCLUDED.images,
      category = EXCLUDED.category,
      inventory = EXCLUDED.inventory,
      featured = EXCLUDED.featured,
      active = EXCLUDED.active
  `;
  return getAllProducts();
}

export async function deleteProduct(id: string): Promise<Product[]> {
  if (!USE_DB) {
    const list = memEnsure();
    memProducts = list.filter((x) => x.id !== id);
    return memProducts;
  }
  await ensureSchema();
  const sql = await db();
  await sql`DELETE FROM products WHERE id = ${id}`;
  return getAllProducts();
}

/* ---------- orders ---------- */
export async function createOrder(o: Order): Promise<Order> {
  if (!USE_DB) {
    memOrders.push(o);
    return o;
  }
  await ensureSchema();
  const sql = await db();
  await sql`
    INSERT INTO orders
      (id, items, amount_usd, currency, customer, status, stripe_session_id, created_at)
    VALUES
      (${o.id}, ${sql.json(o.items)}, ${o.amountUSD}, ${o.currency},
       ${sql.json(o.customer)}, ${o.status}, ${o.stripeSessionId ?? null}, ${o.createdAt})
  `;
  return o;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  if (!USE_DB) return memOrders.find((o) => o.id === id);
  await ensureSchema();
  const sql = await db();
  const rows = await sql<Order[]>`SELECT * FROM orders WHERE id = ${id}`;
  return rows[0] ? rowToOrder(rows[0]) : undefined;
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>
): Promise<Order | undefined> {
  if (!USE_DB) {
    const idx = memOrders.findIndex((o) => o.id === id);
    if (idx < 0) return undefined;
    memOrders[idx] = { ...memOrders[idx], ...patch };
    return memOrders[idx];
  }
  await ensureSchema();
  const sql = await db();
  const sets: string[] = [];
  const params: any[] = [];
  let i = 1;
  if (patch.status !== undefined) {
    sets.push(`status = $${i++}`);
    params.push(patch.status);
  }
  if (patch.stripeSessionId !== undefined) {
    sets.push(`stripe_session_id = $${i++}`);
    params.push(patch.stripeSessionId);
  }
  if (sets.length === 0) return getOrder(id);
  await sql.unsafe(
    `UPDATE orders SET ${sets.join(", ")} WHERE id = $${i}`,
    [...params, id]
  );
  return getOrder(id);
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
