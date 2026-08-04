import { NextRequest, NextResponse } from "next/server";
import { getOrder, updateOrder, getAllOrders, markOrderPaid, deleteOrder } from "@/lib/db";
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

  // Admin confirms payment (Zelle manual confirmation, or any manual override)
  if (adminKey && adminKey === ADMIN_KEY && body.confirm) {
    const updated = await markOrderPaid(order.id);
    return NextResponse.json({ order: updated });
  }

  const stripe = getStripe();

  if (body.demo) {
    const updated = await markOrderPaid(order.id);
    return NextResponse.json({ order: updated });
  }

  if (body.zelleConfirmed) {
    const updated = await updateOrder(order.id, { zelleConfirmed: true });
    return NextResponse.json({ order: updated });
  }

  if (body.sessionId && stripe) {
    const session = await stripe.checkout.sessions.retrieve(body.sessionId);
    if (session.payment_status === "paid") {
      const updated = await markOrderPaid(order.id, session.id);
      return NextResponse.json({ order: updated });
    }
    return NextResponse.json({ order, paid: false });
  }

  return NextResponse.json({ order });
}

// Admin: update fulfillment — status, tracking, note.
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
  if (typeof body.trackingNumber === "string") patch.trackingNumber = body.trackingNumber;
  if (typeof body.trackingUrl === "string") patch.trackingUrl = body.trackingUrl;
  if (typeof body.note === "string") patch.note = body.note;

  // When marking shipped, stamp the timestamp (unless explicitly cleared)
  if (body.status === "shipped" && body.shippedAt === undefined) {
    patch.shippedAt = new Date().toISOString();
  }

  // Transitioning to paid routes through inventory decrement
  if (body.status === "paid") {
    const updated = await markOrderPaid(params.id);
    // still apply any other fields (note etc.)
    if (updated && (patch.note !== undefined)) {
      const withNote = await updateOrder(params.id, { note: patch.note as string });
      return NextResponse.json({ order: withNote });
    }
    return NextResponse.json({ order: updated });
  }

  const updated = await updateOrder(params.id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order: updated });
}

// Admin: delete an order (e.g. test/spam orders).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminKey = _req.headers.get("x-admin-key");
  if (!adminKey || adminKey !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ok = await deleteOrder(params.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
