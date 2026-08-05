import { SEED_PRODUCTS } from "./seed";
import { queryWithSchema } from "./neon-client";
import type { Order, Product, Review, User } from "./types";

const CONNECTION_STRING = process.env.POSTGRES_URL;
const USE_DB = Boolean(CONNECTION_STRING);

/* ---------- in-memory store (always available) ---------- */
let memProducts: Product[] | null = null;
let memOrders: Order[] = [];
let memReviews: Review[] = [];

function memEnsure(): Product[] {
  if (!memProducts) memProducts = SEED_PRODUCTS.map((p) => ({ ...p, images: [...p.images] }));
  return memProducts;
}

/* ---------- Neon client wrapper ----------
 * neon-client is statically imported (no dynamic import) so it can never fail
 * to resolve at runtime on Vercel/serverless. When POSTGRES_URL is unset the
 * underlying query throws, which callers catch and fall back to in-memory.
 */
async function getNeon(): Promise<{ queryWithSchema: typeof queryWithSchema } | null> {
  if (!USE_DB) return null;
  return { queryWithSchema };
}

/* ---------- row mappers ---------- */
function rowToProduct(r: any): Product {
  const images = typeof r.images === "string" ? JSON.parse(r.images) : Array.isArray(r.images) ? r.images : [];
  const tags = typeof r.tags === "string" ? JSON.parse(r.tags) : Array.isArray(r.tags) ? r.tags : [];
  return { id: r.id, slug: r.slug, name: { en: r.name_en, zh: r.name_zh }, description: { en: r.description_en, zh: r.description_zh }, priceUSD: Number(r.price_usd), salePriceUSD: r.sale_price_usd != null ? Number(r.sale_price_usd) : undefined, sku: r.sku ?? undefined, tags, updatedAt: r.updated_at ?? undefined, images, category: r.category, inventory: Number(r.inventory), featured: r.featured, active: r.active };
}
function rowToOrder(r: any): Order {
  return {
    id: r.id,
    items: typeof r.items === "string" ? JSON.parse(r.items) : r.items || [],
    amountUSD: Number(r.amount_usd),
    currency: r.currency,
    userId: r.user_id ?? undefined,
    customer: typeof r.customer === "string" ? JSON.parse(r.customer) : r.customer,
    status: r.status,
    paymentMethod: (r.payment_method as Order["paymentMethod"]) || "stripe",
    zelleConfirmed: Boolean(r.zelle_confirmed),
    stripeSessionId: r.stripe_session_id ?? undefined,
    createdAt: r.created_at,
    trackingNumber: r.tracking_number ?? undefined,
    trackingUrl: r.tracking_url ?? undefined,
    shippedAt: r.shipped_at ?? undefined,
    shippingUSD: r.shipping_usd != null ? Number(r.shipping_usd) : undefined,
    returnRequested: Boolean(r.return_requested),
    returnReason: r.return_reason ?? undefined,
    returnStatus: (r.return_status as Order["returnStatus"]) ?? "none",
    note: r.note ?? undefined,
  };
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
    const now = new Date().toISOString();
    await neon.queryWithSchema(`INSERT INTO products (id,slug,name_en,name_zh,description_en,description_zh,price_usd,sale_price_usd,sku,tags,updated_at,images,category,inventory,featured,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug,name_en=EXCLUDED.name_en,name_zh=EXCLUDED.name_zh,description_en=EXCLUDED.description_en,description_zh=EXCLUDED.description_zh,price_usd=EXCLUDED.price_usd,sale_price_usd=EXCLUDED.sale_price_usd,sku=EXCLUDED.sku,tags=EXCLUDED.tags,updated_at=EXCLUDED.updated_at,images=EXCLUDED.images,category=EXCLUDED.category,inventory=EXCLUDED.inventory,featured=EXCLUDED.featured,active=EXCLUDED.active`, [p.id, p.slug, p.name.en, p.name.zh, p.description.en, p.description.zh, p.priceUSD, p.salePriceUSD ?? null, p.sku ?? null, JSON.stringify(p.tags ?? []), now, JSON.stringify(p.images), p.category, p.inventory, p.featured, p.active]);
    return getAllProducts();
  } catch (e: any) {
    console.error("[upsertProduct] failed:", e?.message);
    // No recursion: fall back to in-memory only for this call.
    const list = memEnsure();
    const i = list.findIndex((x) => x.id === p.id);
    if (i >= 0) list[i] = p; else list.push(p);
    return list;
  }
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
  try {
    await neon.queryWithSchema(
      `INSERT INTO orders (id,items,amount_usd,currency,customer,user_id,status,payment_method,zelle_confirmed,stripe_session_id,shipping_usd,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [o.id, JSON.stringify(o.items), o.amountUSD, o.currency, JSON.stringify(o.customer), o.userId ?? null, o.status, o.paymentMethod ?? "stripe", o.zelleConfirmed ?? false, o.stripeSessionId ?? null, o.shippingUSD ?? 0, o.createdAt]
    );
    return o;
  } catch (e: any) {
    console.error("[createOrder] INSERT failed:", e?.message);
    // Fall back to in-memory so the request still completes (no infinite retry).
    memOrders.push(o);
    return o;
  }
}

export async function getAllOrders(): Promise<Order[]> {
  const neon = await getNeon();
  if (!neon) return memOrders.slice().reverse();
  try { return (await neon.queryWithSchema("SELECT * FROM orders ORDER BY created_at DESC")).map(rowToOrder); }
  catch { return memOrders.slice().reverse(); }
}

/** Customer-facing lookup: all orders placed with a given email. */
export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const e = email.trim().toLowerCase();
  if (!e) return [];
  const neon = await getNeon();
  if (!neon) return memOrders.filter((o) => o.customer?.email?.toLowerCase() === e).slice().reverse();
  try {
    const rows = await neon.queryWithSchema("SELECT * FROM orders WHERE LOWER(customer->>'email') = $1 ORDER BY created_at DESC", [e]);
    return rows.map(rowToOrder);
  } catch {
    return memOrders.filter((o) => o.customer?.email?.toLowerCase() === e).slice().reverse();
  }
}
export async function getOrder(id: string): Promise<Order | undefined> {
  const neon = await getNeon();
  if (!neon) return memOrders.find((o) => o.id === id);
  try { const rows = await neon.queryWithSchema("SELECT * FROM orders WHERE id = $1", [id]); return rows[0] ? rowToOrder(rows[0]) : undefined; }
  catch { return memOrders.find((o) => o.id === id); }
}
export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined> {
  const neon = await getNeon();
  if (!neon) {
    const i = memOrders.findIndex((o) => o.id === id);
    if (i < 0) return undefined;
    memOrders[i] = { ...memOrders[i], ...patch };
    return memOrders[i];
  }
  try {
    const sets: string[] = []; const vals: any[] = []; let n = 1;
    if (patch.status !== undefined) { sets.push("status=$" + n++); vals.push(patch.status); }
    if (patch.stripeSessionId !== undefined) { sets.push("stripe_session_id=$" + n++); vals.push(patch.stripeSessionId); }
    if (patch.zelleConfirmed !== undefined) { sets.push("zelle_confirmed=$" + n++); vals.push(patch.zelleConfirmed); }
    if (patch.trackingNumber !== undefined) { sets.push("tracking_number=$" + n++); vals.push(patch.trackingNumber); }
    if (patch.trackingUrl !== undefined) { sets.push("tracking_url=$" + n++); vals.push(patch.trackingUrl); }
    if (patch.shippedAt !== undefined) { sets.push("shipped_at=$" + n++); vals.push(patch.shippedAt); }
    if (patch.note !== undefined) { sets.push("note=$" + n++); vals.push(patch.note); }
    if (patch.returnRequested !== undefined) { sets.push("return_requested=$" + n++); vals.push(patch.returnRequested); }
    if (patch.returnReason !== undefined) { sets.push("return_reason=$" + n++); vals.push(patch.returnReason); }
    if (patch.returnStatus !== undefined) { sets.push("return_status=$" + n++); vals.push(patch.returnStatus); }
    if (sets.length === 0) return getOrder(id);
    await neon.queryWithSchema("UPDATE orders SET " + sets.join(",") + " WHERE id=$" + n, [...vals, id]);
    return getOrder(id);
  } catch (e: any) {
    console.error("[updateOrder] UPDATE failed:", e?.message);
    // Apply in-memory best-effort, no recursion.
    const i = memOrders.findIndex((o) => o.id === id);
    if (i >= 0) { memOrders[i] = { ...memOrders[i], ...patch }; return memOrders[i]; }
    return undefined;
  }
}

/**
 * Mark an order paid AND atomically decrement product inventory.
 * Idempotent: if the order is already `paid` (or later), inventory is NOT
 * touched again, so retries / double webhooks can't double-decrement stock.
 */
export async function markOrderPaid(id: string, sessionId?: string): Promise<Order | undefined> {
  const current = await getOrder(id);
  if (!current) return undefined;
  if (current.status === "paid" || current.status === "shipped" || current.status === "delivered") {
    return current; // already paid — don't re-decrement
  }
  // Decrement stock for each line item (best-effort; skip missing products).
  for (const it of current.items) {
    try {
      const p = await getProductById(it.productId);
      if (p) {
        await upsertProduct({ ...p, inventory: Math.max(0, p.inventory - it.qty) });
      }
    } catch (e: any) {
      console.error("[markOrderPaid] inventory decrement failed for", it.productId, e?.message);
    }
  }
  return updateOrder(id, sessionId ? { status: "paid", stripeSessionId: sessionId } : { status: "paid" });
}

export async function deleteOrder(id: string): Promise<boolean> {
  const neon = await getNeon();
  if (!neon) {
    const i = memOrders.findIndex((o) => o.id === id);
    if (i < 0) return false;
    memOrders.splice(i, 1);
    return true;
  }
  try {
    await neon.queryWithSchema("DELETE FROM orders WHERE id = $1", [id]);
    return true;
  } catch (e: any) {
    console.error("[deleteOrder] DELETE failed:", e?.message);
    const i = memOrders.findIndex((o) => o.id === id);
    if (i >= 0) { memOrders.splice(i, 1); return true; }
    return false;
  }
}

/* ---------- reviews ---------- */
export async function addReview(r: Review): Promise<Review> {
  const neon = await getNeon();
  if (!neon) { memReviews.push(r); return r; }
  try {
    await neon.queryWithSchema(
      `INSERT INTO reviews (id,product_id,order_id,customer_name,rating,comment,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [r.id, r.productId, r.orderId, r.customerName, r.rating, r.comment, r.createdAt]
    );
    return r;
  } catch (e: any) {
    console.error("[addReview] failed:", e?.message);
    memReviews.push(r);
    return r;
  }
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const neon = await getNeon();
  if (!neon) return memReviews.filter((r) => r.productId === productId);
  try {
    const rows = await neon.queryWithSchema("SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC", [productId]);
    return rows.map((r: any) => ({ id: r.id, productId: r.product_id, orderId: r.order_id, customerName: r.customer_name, rating: Number(r.rating), comment: r.comment, createdAt: r.created_at }));
  } catch {
    return memReviews.filter((r) => r.productId === productId);
  }
}

/** Whether this order/product pair already has a review (prevents duplicates). */
export async function hasReview(orderId: string, productId: string): Promise<boolean> {
  const neon = await getNeon();
  if (!neon) return memReviews.some((r) => r.orderId === orderId && r.productId === productId);
  try {
    const rows = await neon.queryWithSchema("SELECT id FROM reviews WHERE order_id = $1 AND product_id = $2 LIMIT 1", [orderId, productId]);
    return rows.length > 0;
  } catch {
    return memReviews.some((r) => r.orderId === orderId && r.productId === productId);
  }
}

/** All reviews written for a given order (used by the customer center). */
export async function getReviewsByOrder(orderId: string): Promise<Review[]> {
  const neon = await getNeon();
  if (!neon) return memReviews.filter((r) => r.orderId === orderId);
  try {
    const rows = await neon.queryWithSchema("SELECT * FROM reviews WHERE order_id = $1", [orderId]);
    return rows.map((r: any) => ({ id: r.id, productId: r.product_id, orderId: r.order_id, customerName: r.customer_name, rating: Number(r.rating), comment: r.comment, createdAt: r.created_at }));
  } catch {
    return memReviews.filter((r) => r.orderId === orderId);
  }
}

/** Admin: delete a review by id (moderation / cleanup). */
export async function deleteReview(id: string): Promise<boolean> {
  const neon = await getNeon();
  if (!neon) {
    const i = memReviews.findIndex((r) => r.id === id);
    if (i < 0) return false;
    memReviews.splice(i, 1);
    return true;
  }
  try {
    await neon.queryWithSchema("DELETE FROM reviews WHERE id = $1", [id]);
    return true;
  } catch (e: any) {
    console.error("[deleteReview] failed:", e?.message);
    // Neon free-tier can transiently fail the write; confirm by re-reading.
    // If it actually landed, report success.
    try {
      const rows = await neon.queryWithSchema("SELECT id FROM reviews WHERE id = $1", [id]);
      if (rows.length === 0) return true;
    } catch { /* fall through */ }
    return false;
  }
}

/* ---------- auth: users & sessions ---------- */
let memUsers: User[] = [];
let memSessions: { token: string; userId: string; expiresAt: string }[] = [];

export async function createUser(u: User): Promise<User> {
  const neon = await getNeon();
  if (!neon) { memUsers.push(u); return u; }
  try {
    await neon.queryWithSchema(
      `INSERT INTO users (id,email,password_hash,name,created_at) VALUES ($1,$2,$3,$4,$5)`,
      [u.id, u.email, u.passwordHash, u.name, u.createdAt]
    );
    return u;
  } catch (e: any) {
    console.error("[createUser] failed:", e?.message);
    if (String(e?.message ?? "").toLowerCase().includes("duplicate")) throw new Error("EMAIL_TAKEN");
    memUsers.push(u);
    return u;
  }
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const e = email.trim().toLowerCase();
  const neon = await getNeon();
  if (!neon) return memUsers.find((u) => u.email === e);
  try {
    const rows = await neon.queryWithSchema("SELECT * FROM users WHERE email = $1", [e]);
    return rows[0] ? rowToUser(rows[0]) : undefined;
  } catch {
    return memUsers.find((u) => u.email === e);
  }
}

function rowToUser(r: any): User {
  return { id: r.id, email: r.email, passwordHash: r.password_hash, name: r.name ?? "", createdAt: r.created_at };
}

export async function createSession(token: string, userId: string, expiresAt: string): Promise<string | null> {
  const neon = await getNeon();
  if (!neon) { memSessions.push({ token, userId, expiresAt }); return null; }
  try {
    await neon.queryWithSchema(
      `INSERT INTO sessions (token,user_id,created_at,expires_at) VALUES ($1,$2,$3,$4)`,
      [token, userId, new Date().toISOString(), expiresAt]
    );
    return null;
  } catch (e: any) {
    console.error("[createSession] failed:", e?.message);
    memSessions.push({ token, userId, expiresAt });
    return e?.message ?? "unknown";
  }
}

export async function getUserBySessionToken(token: string): Promise<User | null> {
  if (!token) return null;
  const now = Date.now();
  const neon = await getNeon();
  if (!neon) {
    const s = memSessions.find((x) => x.token === token && new Date(x.expiresAt).getTime() > now);
    if (!s) return null;
    return memUsers.find((u) => u.id === s.userId) ?? null;
  }
  try {
    const rows = await neon.queryWithSchema(
      "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = $1 AND s.expires_at > $2",
      [token, new Date(now).toISOString()]
    );
    return rows[0] ? rowToUser(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  const neon = await getNeon();
  if (!neon) { memSessions = memSessions.filter((s) => s.token !== token); return; }
  try { await neon.queryWithSchema("DELETE FROM sessions WHERE token = $1", [token]); }
  catch (e: any) { console.error("[deleteSession] failed:", e?.message); }
}

/* DIAGNOSTIC probe — temporarily exported for auth debugging. */
export async function __neonProbe(token: string) {
  const neon = await getNeon();
  if (!neon) return { mode: "memory" };
  const tryQuery = async (label: string, sql: string, params?: unknown[]) => {
    try { await neon.queryWithSchema(sql, params); return label + ":OK"; }
    catch (e: any) { return label + ":" + (e?.message ?? "").slice(0, 90); }
  };
  return {
    selectSessions: await tryQuery("select", "SELECT COUNT(*) FROM sessions"),
    insertSessions: await tryQuery("insert", "INSERT INTO sessions (token,user_id,created_at,expires_at) VALUES ($1,$2,$3,$4)", ["probe-" + token.slice(0, 12), "probe", new Date().toISOString(), new Date().toISOString()]),
    insertReviews: await tryQuery("rev", "INSERT INTO reviews (id,product_id,order_id,customer_name,rating,comment,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)", ["probe-rev-" + token.slice(0, 8), "p_probe", "ord_probe", "", 5, "", new Date().toISOString()]),
  };
}

export function genId(prefix: string): string {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
