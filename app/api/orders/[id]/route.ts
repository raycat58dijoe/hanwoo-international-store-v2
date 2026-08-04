import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrder } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = getOrder(params.id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = getOrder(params.id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const stripe = getStripe();

  if (body.demo) {
    const updated = updateOrder(order.id, { status: "paid" });
    return NextResponse.json({ order: updated });
  }

  if (body.sessionId && stripe) {
    const session = await stripe.checkout.sessions.retrieve(body.sessionId);
    if (session.payment_status === "paid") {
      const updated = updateOrder(order.id, {
        status: "paid",
        stripeSessionId: session.id,
      });
      return NextResponse.json({ order: updated });
    }
    return NextResponse.json({ order, paid: false });
  }

  return NextResponse.json({ order });
}
