import { NextRequest, NextResponse } from "next/server";
import { getProductById, createOrder, updateOrder, genId } from "@/lib/db";
import { convert, RATES } from "@/lib/currency";
import { getStripe } from "@/lib/stripe";
import type { Order, OrderItem, Product } from "@/lib/types";

function toMinor(usd: number, currency: string): number {
  const v = convert(usd, currency);
  const decimals = currency === "JPY" ? 0 : 2;
  return Math.round(v * 10 ** decimals);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.items as { productId: string; qty: number }[];
    const customer = body.customer as Order["customer"];
    const currency = (body.currency as string) || "USD";

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const orderItems: OrderItem[] = [];
    let amountUSD = 0;

    for (const it of items) {
      const p: Product | undefined = getProductById(it.productId);
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
      orderItems.push({
        productId: p.id,
        name: p.name,
        image: p.images[0] ?? "",
        priceUSD: p.priceUSD,
        qty: it.qty,
      });
      amountUSD += p.priceUSD * it.qty;
    }

    const order: Order = {
      id: genId("ord"),
      items: orderItems,
      amountUSD,
      currency,
      customer,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    createOrder(order);

    const stripe = getStripe();
    // Prefer the configured production domain for redirects; fall back to the
    // request origin (handy in local/dev where NEXT_PUBLIC_SITE_URL may be unset).
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      req.nextUrl.origin;
    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: customer.email,
        line_items: orderItems.map((oi) => ({
          quantity: oi.qty,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: toMinor(oi.priceUSD, currency),
            product_data: {
              name: oi.name.en,
              images: oi.image ? [oi.image] : undefined,
            },
          },
        })),
        metadata: { orderId: order.id },
        success_url: `${siteUrl}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/cart`,
      });
      updateOrder(order.id, { stripeSessionId: session.id });
      return NextResponse.json({ orderId: order.id, url: session.url });
    }

    // Demo mode: no Stripe key configured.
    return NextResponse.json({ orderId: order.id, demo: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Checkout failed" }, { status: 500 });
  }
}
