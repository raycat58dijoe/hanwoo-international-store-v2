import { NextRequest, NextResponse } from "next/server";
import { deleteProduct } from "@/lib/db";

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
