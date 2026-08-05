import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/db";
import { ProductView } from "@/components/ProductView";

const SITE_URL = "https://hanwoointernationalinc.net";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product || !product.active) return {};
  const price = product.salePriceUSD ?? product.priceUSD;
  return {
    title: `${product.name.en} — ${product.name.zh}`,
    description: product.description.en,
    openGraph: {
      type: "website",
      title: product.name.en,
      description: product.description.en,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product || !product.active) notFound();

  const price = product.salePriceUSD ?? product.priceUSD;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name.en,
    description: product.description.en,
    image: product.images.map((i) => (i.startsWith("http") ? i : SITE_URL + i)),
    sku: product.sku ?? product.id,
    brand: { "@type": "Brand", name: "Hanwoo International Inc." },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "USD",
      price: price.toFixed(2),
      availability: product.inventory > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView product={product} />
    </>
  );
}
