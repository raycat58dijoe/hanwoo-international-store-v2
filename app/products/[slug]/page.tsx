import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/db";
import { ProductView } from "@/components/ProductView";

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = getProductBySlug(params.slug);
  if (!product || !product.active) notFound();
  return <ProductView product={product} />;
}
