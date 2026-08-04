import { getProducts } from "@/lib/db";
import { ProductsView } from "@/components/ProductsView";

export default function ProductsPage() {
  const products = getProducts();
  return <ProductsView products={products} />;
}
