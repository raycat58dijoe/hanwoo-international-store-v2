/**
 * Neon HTTP client — pure fetch, zero npm dependencies.
 * Uses Neon's /sql endpoint with proper authentication.
 * Only imported at runtime via dynamic import() from db.ts.
 */

const CONN_STR = process.env.POSTGRES_URL;

async function query<T = any>(sql: string, params?: unknown[]): Promise<T[]> {
  if (!CONN_STR) throw new Error("POSTGRES_URL not set");

  // Neon's /sql endpoint requires the connection string in a special header
  const res = await fetch("https://" + new URL(CONN_STR).hostname + "/sql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "neon-connection-string": CONN_STR,
    },
    body: JSON.stringify({ query: sql, params: params ?? [] }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Neon HTTP " + res.status + ": " + text);
  }

  const data = await res.json();
  return data.rows ?? data ?? [];
}

/* ---------- schema bootstrap ---------- */
let _ready: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!_ready) {
    _ready = (async () => {
      await query(`CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL, name_zh TEXT NOT NULL,
        description_en TEXT DEFAULT '', description_zh TEXT DEFAULT '',
        price_usd NUMERIC(10,2) NOT NULL,
        images JSONB DEFAULT '[]'::jsonb,
        category TEXT DEFAULT 'General',
        inventory INTEGER DEFAULT 0,
        featured BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT TRUE
      )`);
      await query(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        items JSONB DEFAULT '[]'::jsonb,
        amount_usd NUMERIC(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        customer JSONB NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'stripe',
        zelle_confirmed BOOLEAN DEFAULT FALSE,
        stripe_session_id TEXT,
        created_at TEXT NOT NULL
      )`);
      // Idempotent: add columns if an older table already exists
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe'`);
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS zelle_confirmed BOOLEAN DEFAULT FALSE`);
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT`);
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT`);
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TEXT`);
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT`);

      // Dynamic import of seed to avoid circular deps
      const { SEED_PRODUCTS } = await import("./seed");
      const rows = await query<{ count: number }>("SELECT COUNT(*)::int AS count FROM products");
      if (rows[0]?.count === 0) {
        for (const p of SEED_PRODUCTS) {
          await query(
            `INSERT INTO products (id,slug,name_en,name_zh,description_en,description_zh,price_usd,images,category,inventory,featured,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING`,
            [p.id, p.slug, p.name.en, p.name.zh, p.description.en, p.description.zh, p.priceUSD, JSON.stringify(p.images), p.category, p.inventory, p.featured, p.active]
          );
        }
        console.log("[neon] Seeded " + SEED_PRODUCTS.length + " products");
      }
    })().catch((e: unknown) => { _ready = null; throw e; });
  }
  return _ready;
}

// Wrap query to ensure schema exists first
export async function queryWithSchema<T = any>(sql: string, params?: unknown[]): Promise<T[]> {
  await ensureSchema();
  return query<T>(sql, params);
}
