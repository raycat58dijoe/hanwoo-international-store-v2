import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { getOrder, updateOrder } from "@/lib/db";

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
    if (STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(raw); // local/dev without signature verification
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err?.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId && getOrder(orderId)) {
      updateOrder(orderId, { status: "paid", stripeSessionId: session.id });
    }
  }

  return NextResponse.json({ received: true });
}
