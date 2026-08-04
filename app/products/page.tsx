import { getProducts } from "@/lib/db";
import { ProductsView, SortKey } from "@/components/ProductsView";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string; q?: string };
}) {
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
