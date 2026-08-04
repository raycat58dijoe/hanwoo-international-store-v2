import { getProducts } from "@/lib/db";
import { HomeView } from "@/components/HomeView";

export default function HomePage() {
  const products = getProducts();
  return <HomeView products={products} />;
}
