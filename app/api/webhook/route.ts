import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { getOrder, markOrderPaid } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event;
  try {
    // SECURITY: always require a valid signature in production. Without a
    // configured webhook secret we refuse to process anything, so attackers
    // can never forge a "checkout.session.completed" event.
    if (STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      return NextResponse.json({ error: "Webhook signature verification not configured" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err?.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId && (await getOrder(orderId))) {
      await markOrderPaid(orderId, session.id);
    }
  }

  return NextResponse.json({ received: true });
}
