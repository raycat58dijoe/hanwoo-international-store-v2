import { SEED_PRODUCTS } from "./seed";
import type { Order, Product } from "./types";

const CONNECTION_STRING = process.env.POSTGRES_URL;
const USE_DB = Boolean(CONNECTION_STRING);

function parseConnStr(s: string) {
  const url = new URL(s);
  return { host: url.hostname, user: url.username, pass: url.password, dbname: url.pathname.slice(1) || "neondb" };
}

async function query<T = any>(sql: string, params?: unknown[]): Promise<T[]> {
  const c = parseConnStr(CONNECTION_STRING!);
  const auth = Buffer.from(c.user + ":" + c.pass).toString("base64");
  const res = await fetch("https://" + c.host + "/sql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Basic " + auth },
    body: JSON.stringify({ query: sql, params: params ?? [] }),
  });
  if (!res.ok) { const text = await res.text(); throw new Error("Neon HTTP " + res.status + ": " + text); }
  const data = await res.json();
  return data.rows ?? data ?? [];
}

/* ---------- in-memory store ---------- */
let memProducts: Product[] | null = null;
let memOrders: Order[] = [];

function memEnsure(): Product[] {
  if (!memProducts) {
    memProducts = SEED_PRODUCTS.map((p) => ({ ...p, images: [...p.images] }));
  }
  return memProducts;
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

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return memEnsure().find((p) => p.slug === slug);
}

export async function upsertProduct(p: Product): Promise<Product[]> {
  const list = memEnsure();
  const idx = list.findIndex((x) => x.id === p.id);
  if (idx >= 0) list[idx] = p; else list.push(p);
  return list;
}

export async function deleteProduct(id: string): Promise<Product[]> {
  memProducts = memEnsure().filter((x) => x.id !== id);
  return memProducts!;
}

/* ---------- orders ---------- */
export async function createOrder(o: Order): Promise<Order> {
  memOrders.push(o); return o;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return memOrders.find((o) => o.id === id);
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined> {
  const i = memOrders.findIndex((o) => o.id === id);
  if (i < 0) return undefined;
  memOrders[i] = { ...memOrders[i], ...patch };
  return memOrders[i];
}

export function genId(prefix: string): string {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
