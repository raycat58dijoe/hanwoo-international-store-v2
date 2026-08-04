import { getProducts } from "@/lib/db";
import { ProductsView } from "@/components/ProductsView";

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductsView products={products} />;
}
