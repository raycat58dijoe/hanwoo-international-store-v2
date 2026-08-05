import { getProducts } from "@/lib/db";
import { HomeView } from "@/components/HomeView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();
  return <HomeView products={products} />;
}
