import { NextRequest, NextResponse } from "next/server";
import { getAllOrders } from "@/lib/db";

const ADMIN_KEY = process.env.ADMIN_KEY ?? "admin123";

// Admin-only: list all orders. Protected by the same x-admin-key used for products.
export async function GET(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await getAllOrders();
  return NextResponse.json({ orders });
}
