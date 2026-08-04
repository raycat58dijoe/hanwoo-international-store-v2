import { MetadataRoute } from "next";
import { getProducts } from "@/lib/db";

const SITE_URL = "https://hanwoointernationalinc.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const staticPages = ["", "products", "cart", "checkout", "track", "privacy", "terms", "contact", "shipping", "returns"];
  const now = new Date();

  return [
    ...staticPages.map((p) => ({
      url: `${SITE_URL}/${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    ...products.filter((p) => p.active).map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
