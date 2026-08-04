import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, upsertProduct } from "@/lib/db";
import type { Product } from "@/lib/types";

const ADMIN_KEY = process.env.ADMIN_KEY ?? "admin123";

export async function GET() {
  return NextResponse.json({ products: getAllProducts() });
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Partial<Product>;
  if (!body.id || !body.name || !body.priceUSD) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const product: Product = {
    id: body.id,
    slug: body.slug || body.id,
    name: body.name,
    description: body.description ?? { en: "", zh: "" },
    priceUSD: Number(body.priceUSD),
    images: body.images ?? [],
    category: body.category ?? "General",
    inventory: Number(body.inventory ?? 0),
    featured: Boolean(body.featured),
    active: body.active !== false,
  };
  const products = upsertProduct(product);
  return NextResponse.json({ products });
}
