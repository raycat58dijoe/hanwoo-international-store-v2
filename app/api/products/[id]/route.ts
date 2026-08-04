import { NextRequest, NextResponse } from "next/server";
import { deleteProduct, getProductById, upsertProduct } from "@/lib/db";
import type { Product } from "@/lib/types";

const ADMIN_KEY = process.env.ADMIN_KEY ?? "admin123";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const key = req.headers.get("x-admin-key");
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const products = await deleteProduct(params.id);
  return NextResponse.json({ products });
}

// Admin: partial update — quick inventory adjust, activate/deactivate, price/sale price, etc.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const key = req.headers.get("x-admin-key");
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const current = await getProductById(params.id);
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));

  const next: Product = { ...current, name: { ...current.name }, description: { ...current.description }, images: [...current.images] };

  if (typeof body.inventory === "number") next.inventory = Math.max(0, Math.round(body.inventory));
  if (typeof body.inventoryDelta === "number") next.inventory = Math.max(0, next.inventory + Math.round(body.inventoryDelta));
  if (typeof body.active === "boolean") next.active = body.active;
  if (typeof body.featured === "boolean") next.featured = body.featured;
  if (typeof body.priceUSD === "number") next.priceUSD = Number(body.priceUSD);
  if (body.salePriceUSD !== undefined) {
    const v = body.salePriceUSD === null ? null : Number(body.salePriceUSD);
    next.salePriceUSD = v != null && v > 0 ? v : undefined;
  }
  if (typeof body.category === "string") next.category = body.category;
  if (typeof body.slug === "string" && body.slug.trim()) next.slug = body.slug.trim();
  if (body.name && (typeof body.name.en === "string" || typeof body.name.zh === "string")) {
    if (typeof body.name.en === "string") next.name.en = body.name.en;
    if (typeof body.name.zh === "string") next.name.zh = body.name.zh;
  }
  if (body.description && (typeof body.description.en === "string" || typeof body.description.zh === "string")) {
    if (typeof body.description.en === "string") next.description.en = body.description.en;
    if (typeof body.description.zh === "string") next.description.zh = body.description.zh;
  }
  if (Array.isArray(body.images)) next.images = body.images.filter(Boolean);

  const products = await upsertProduct(next);
  return NextResponse.json({ products, product: next });
}
