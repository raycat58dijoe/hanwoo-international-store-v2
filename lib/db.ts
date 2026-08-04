import { SEED_PRODUCTS } from "./seed";
import type { Order, Product } from "./types";

/**
 * In-memory database layer.
 *
 * Currently runs entirely from seed data — no external dependencies,
 * no network calls, zero chance of module_not_found at build time.
 *
 * TODO: When Neon is connected, switch to the Postgres-backed version.
 */

/* ---------- in-memory store ---------- */
let memProducts: Product[] | null = null;
let memOrders: Order[] = [];

function memEnsure(): Product[] {
  if (!memProducts) {
    memProducts = SEED_PRODUCTS.map((p) => ({ ...p, images: [...p.images] }));
  }
  return memProducts;
}

/* ---------- row mappers (kept for API compat) ---------- */
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
  return memEnsure().filter((p) => p.active);
}

export async function getAllProducts(): Promise<Product[]> {
  return memEnsure();
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return memEnsure().find((p) => p.id === id);
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  return memEnsure().find((p) => p.slug === slug);
}

export async function upsertProduct(p: Product): Promise<Product[]> {
  const list = memEnsure();
  const idx = list.findIndex((x) => x.id === p.id);
  if (idx >= 0) list[idx] = p;
  else list.push(p);
  return list;
}

export async function deleteProduct(id: string): Promise<Product[]> {
  memProducts = memEnsure().filter((x) => x.id !== id);
  return memProducts!;
}

/* ---------- orders ---------- */
export async function createOrder(o: Order): Promise<Order> {
  memOrders.push(o);
  return o;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return memOrders.find((o) => o.id === id);
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>
): Promise<Order | undefined> {
  const idx = memOrders.findIndex((o) => o.id === id);
  if (idx < 0) return undefined;
  memOrders[idx] = { ...memOrders[idx], ...patch };
  return memOrders[idx];
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
