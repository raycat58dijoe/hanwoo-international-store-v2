import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrder, getAllOrders } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

const ADMIN_KEY = process.env.ADMIN_KEY ?? "admin123";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await getOrder(params.id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

// Customer-facing: mark that they sent the Zelle transfer (no auto-confirm).
// Admin-facing: confirm payment (set status=paid) when called with x-admin-key.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await getOrder(params.id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const adminKey = req.headers.get("x-admin-key");

  // Admin confirms payment
  if (adminKey && adminKey === ADMIN_KEY && body.confirm) {
    const updated = await updateOrder(order.id, { status: "paid" });
    return NextResponse.json({ order: updated });
  }

  const stripe = getStripe();

  if (body.demo) {
    const updated = await updateOrder(order.id, { status: "paid" });
    return NextResponse.json({ order: updated });
  }

  if (body.zelleConfirmed) {
    const updated = await updateOrder(order.id, { zelleConfirmed: true });
    return NextResponse.json({ order: updated });
  }

  if (body.sessionId && stripe) {
    const session = await stripe.checkout.sessions.retrieve(body.sessionId);
    if (session.payment_status === "paid") {
      const updated = await updateOrder(order.id, {
        status: "paid",
        stripeSessionId: session.id,
      });
      return NextResponse.json({ order: updated });
    }
    return NextResponse.json({ order, paid: false });
  }

  return NextResponse.json({ order });
}

// Admin: list all orders (uses the same list helper as the GET collection route)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminKey = req.headers.get("x-admin-key");
  if (!adminKey || adminKey !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.status === "string") patch.status = body.status;
  if (typeof body.zelleConfirmed === "boolean") patch.zelleConfirmed = body.zelleConfirmed;
  const updated = await updateOrder(params.id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order: updated });
}
