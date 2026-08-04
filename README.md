# Hanwoo International Inc. — Cross-border E-commerce Store

A complete, self-contained independent storefront built with **Next.js 14 (App Router)**,
**Tailwind CSS**, and **Stripe** (test/demo mode out of the box). It covers the full
flow: browse → product detail → cart → checkout → order → admin.

## Features
- 🛍️ Storefront: home, product listing with category filter, product detail with gallery
- 🛒 Cart with `localStorage` persistence, quantity controls, multi-currency display
- 💱 Multi-currency (USD/EUR/GBP/JPY/CNY) with live-switching UI
- 🌐 i18n (English / 中文) with one-click toggle
- 💳 Checkout via **Stripe Checkout** (real payments) **or DEMO mode** (no key needed)
- 📦 Orders persisted to a JSON file store (swap to Postgres/SQLite for production)
- 🛠️ Admin panel at `/admin` for product CRUD (protected by `ADMIN_KEY`)
- 📨 Stripe webhook to mark orders paid

## Quick start
```bash
npm install
cp .env.example .env      # optional; works without keys in demo mode
npm run dev               # http://localhost:3000
```
Open http://localhost:3000. Add products to cart → checkout. Without a Stripe key the
order is marked paid immediately (demo). With a key you are redirected to Stripe.

## Enabling real payments (Stripe)
1. Create an account at https://stripe.com and copy the **Secret key** (`sk_...`).
2. Put it in `.env`: `STRIPE_SECRET_KEY=sk_test_...`
3. Restart `npm run dev`. Checkout now creates a real Stripe Checkout session.
4. (Optional) For automatic order marking, set up the webhook:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   # copy the printed signing secret into STRIPE_WEBHOOK_SECRET
   ```
   Use test cards like `4242 4242 4242 4242`.

> The publishable key is only needed if you later switch to client-side Stripe Elements.

## Data store
Products and orders live in `data/store.json` (auto-seeded on first run). To reset,
delete that file. For production, replace `lib/db.ts` with a real database and add
inventory decrement logic on successful payment.

## Deploy (Vercel — best for cross-border)
1. Push this folder to GitHub.
2. Import the repo at https://vercel.com → it detects Next.js automatically.
3. Add the env vars (`STRIPE_SECRET_KEY`, `ADMIN_KEY`, `NEXT_PUBLIC_SITE_URL`).
4. Deploy, then add the custom domain **`hanwoointernationalinc.net`** in the Vercel
   dashboard (Project → Settings → Domains). Vercel will show the DNS records to set.

### Point `hanwoointernationalinc.net` at Vercel (DNS)
Set these at your domain registrar (where you bought `hanwoointernationalinc.net`):
- **A record** `@` → `76.76.21.21` (Vercel's apex IP), **or**
- **CNAME record** `www` → `cname.vercel-dns.com`
Vercel also offers a nameserver option (move the whole zone to Vercel's DNS) which is
the simplest — just set the 2 Vercel nameservers at the registrar and forget about records.

## Project structure
```
app/
  page.tsx                 # home (server) -> HomeView
  products/                # listing + [slug] detail
  cart/                    # cart
  checkout/                # checkout + success
  admin/                   # product CRUD
  api/
    products/              # GET list, POST upsert, DELETE (admin)
    checkout/              # create order + Stripe session
    orders/[id]/           # GET + confirm (paid)
    webhook/               # Stripe webhook
components/                # UI + context providers (I18n, Cart)
lib/                       # db (JSON store), stripe, currency, i18n, types, seed
```

## Notes / next steps
- Add real auth to `/admin` (currently a single shared key).
- Decrement inventory on paid orders.
- Add shipping rates, tax, and coupon support.
- Replace the JSON store with Postgres for concurrency safety.
- Add SEO (sitemaps, structured data) and analytics for marketing.
