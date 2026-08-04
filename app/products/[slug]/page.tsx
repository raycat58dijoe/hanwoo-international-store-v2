import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/db";
import { ProductView } from "@/components/ProductView";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product || !product.active) notFound();
  return <ProductView product={product} />;
}
