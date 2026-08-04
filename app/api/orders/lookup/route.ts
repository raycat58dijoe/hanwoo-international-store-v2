import { NextRequest, NextResponse } from "next/server";
import { getOrdersByEmail } from "@/lib/db";

// Customer-facing order lookup by email (no auth — returns only the orders
// tied to the submitted email address).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const orders = await getOrdersByEmail(email);
  return NextResponse.json({ orders });
}
