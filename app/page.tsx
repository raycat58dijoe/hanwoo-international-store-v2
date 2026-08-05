import { getProducts } from "@/lib/db";
import { HomeView } from "@/components/HomeView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();
  // build-marker: deploy-2026-08-05-v2
  return (
    <>
      <HomeView products={products} />
    </>
  );
}
