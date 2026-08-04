import { NextRequest, NextResponse } from "next/server";
import { getOrder, addReview, hasReview, getReviewsByProduct, getReviewsByOrder, deleteReview, genId } from "@/lib/db";
import type { Review } from "@/lib/types";

const ADMIN_KEY = process.env.ADMIN_KEY ?? "admin123";

// POST: submit a review for a delivered order item (no auth — tied to the order).
// GET: list reviews for a product (public).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const rating = Math.round(Number(body.rating));
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : "";

  if (!productId || !orderId) return NextResponse.json({ error: "Missing product or order." }, { status: 400 });
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "Rating must be 1-5." }, { status: 400 });

  const order = await getOrder(orderId);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "delivered") {
    return NextResponse.json({ error: "You can review this product after the order is delivered." }, { status: 400 });
  }
  const item = (order.items ?? []).find((i) => i.productId === productId);
  if (!item) return NextResponse.json({ error: "Product not in this order." }, { status: 400 });

  if (await hasReview(orderId, productId)) {
    return NextResponse.json({ error: "You have already reviewed this product." }, { status: 400 });
  }

  const review: Review = {
    id: genId("rev"),
    productId,
    orderId,
    customerName: order.customer?.name ?? "Customer",
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };
  await addReview(review);
  return NextResponse.json({ review });
}

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId") ?? "";
  const orderId = req.nextUrl.searchParams.get("orderId") ?? "";
  if (orderId) {
    return NextResponse.json({ reviews: await getReviewsByOrder(orderId) });
  }
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
  const reviews = await getReviewsByProduct(productId);
  return NextResponse.json({ reviews });
}

// Admin: delete a review (moderation).
export async function DELETE(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (key !== ADMIN_KEY) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = await deleteReview(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
