import { NextRequest, NextResponse } from "next/server";
import { getProductById, createOrder, updateOrder, genId, getUserBySessionToken } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { calcShippingUSD } from "@/lib/shipping";
import { SESSION_COOKIE } from "@/lib/auth";
import type { Order, OrderItem, Product, PaymentMethod } from "@/lib/types";

// Merchant's enrolled Zelle identifier (email or US phone). Set via the
// ZELLE_ID env var on Vercel; falls back to a clearly-marked placeholder so
// the UI still renders during local/dev.
const ZELLE_ID = process.env.ZELLE_ID || "set-via-ZELLE_ID-env";

// All payments are collected in USD regardless of the display currency,
// so exchange-rate risk is avoided.
const SETTLE_CURRENCY = "USD";

function toMinor(usd: number, currency: string): number {
  const decimals = currency === "JPY" ? 0 : 2;
  return Math.round(usd * 10 ** decimals);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.items as { productId: string; qty: number }[];
    const customer = body.customer as Order["customer"];
    const currency = (body.currency as string) || "USD";
    const method = (body.method as PaymentMethod) || "stripe";

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const orderItems: OrderItem[] = [];
    let subtotalUSD = 0;

    for (const it of items) {
      const p: Product | undefined = await getProductById(it.productId);
      if (!p || !p.active) {
        return NextResponse.json(
          { error: `Product unavailable: ${it.productId}` },
          { status: 400 }
        );
      }
      if (p.inventory < it.qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${p.name.en}` },
          { status: 400 }
        );
      }
      // Charge the sale price when one is set; otherwise the base price.
      const unitUSD = p.salePriceUSD ?? p.priceUSD;
      orderItems.push({
        productId: p.id,
        name: p.name,
        image: p.images[0] ?? "",
        priceUSD: unitUSD,
        qty: it.qty,
      });
      subtotalUSD += unitUSD * it.qty;
    }

    const shippingUSD = calcShippingUSD(subtotalUSD);
    const amountUSD = subtotalUSD + shippingUSD;

    // Attach the account when a session cookie is present.
    const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
    const signedInUser = sessionToken ? await getUserBySessionToken(sessionToken) : null;

    const order: Order = {
      id: genId("ord"),
      items: orderItems,
      amountUSD,
      currency,
      userId: signedInUser?.id,
      customer,
      status: "pending",
      paymentMethod: method,
      shippingUSD,
      createdAt: new Date().toISOString(),
    };
    await createOrder(order);

    // ---------- Zelle: manual bank transfer (no API / no redirect) ----------
    if (method === "zelle") {
      return NextResponse.json({
        orderId: order.id,
        method: "zelle",
        zelle: {
          id: ZELLE_ID,
          amountUSD,
          currency: SETTLE_CURRENCY,
          orderId: order.id,
        },
        shippingUSD,
        subtotalUSD,
      });
    }

    // ---------- Stripe Checkout (instant, automatic confirmation) ----------
    const stripe = getStripe();
    // Prefer the configured production domain for redirects; fall back to the
    // request origin (handy in local/dev where NEXT_PUBLIC_SITE_URL may be unset).
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      req.nextUrl.origin;
    if (stripe) {
      const line_items = orderItems.map((oi) => ({
        quantity: oi.qty,
        price_data: {
          currency: SETTLE_CURRENCY.toLowerCase(),
          unit_amount: toMinor(oi.priceUSD, SETTLE_CURRENCY),
          product_data: {
            name: oi.name.en,
            images: oi.image ? [oi.image] : [],
          },
        },
      }));
      if (shippingUSD > 0) {
        line_items.push({
          quantity: 1,
          price_data: {
            currency: SETTLE_CURRENCY.toLowerCase(),
            unit_amount: toMinor(shippingUSD, SETTLE_CURRENCY),
            product_data: { name: "International shipping", images: [] },
          },
        });
      }
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: customer.email,
        line_items,
        metadata: { orderId: order.id },
        success_url: `${siteUrl}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/cart`,
      });
      await updateOrder(order.id, { stripeSessionId: session.id });
      return NextResponse.json({ orderId: order.id, url: session.url, shippingUSD, subtotalUSD });
    }

    // Demo mode: no Stripe key configured.
    return NextResponse.json({ orderId: order.id, demo: true, shippingUSD, subtotalUSD });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Checkout failed" }, { status: 500 });
  }
}
