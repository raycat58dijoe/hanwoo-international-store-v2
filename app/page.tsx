import { getProducts } from "@/lib/db";
import { HomeView } from "@/components/HomeView";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  headers(); // force dynamic — prevents static prerender and build cache
  const products = await getProducts();
  return <HomeView products={products} />;
}
