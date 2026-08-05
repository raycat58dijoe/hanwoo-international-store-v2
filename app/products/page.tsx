import { getProducts } from "@/lib/db";
import { ProductsView, SortKey } from "@/components/ProductsView";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string; q?: string };
}) {
  headers(); // force dynamic
  const products = await getProducts();
  const category = searchParams.category ?? "all";
  const sort = (["newest", "price-asc", "price-desc"].includes(searchParams.sort ?? "")
    ? searchParams.sort
    : "newest") as SortKey;
  return (
    <ProductsView
      products={products}
      initialCategory={category}
      initialQuery={searchParams.q ?? ""}
      initialSort={sort}
    />
  );
}
