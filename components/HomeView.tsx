"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { ProductCard } from "./ProductCard";

export function HomeView({ products }: { products: Product[] }) {
  const { t } = useI18n();
  const featured = products.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="container-page py-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 px-6 py-16 text-white sm:px-12 sm:py-24">
        <div className="max-w-xl">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
            {t("home.hero.title")}
          </h1>
          <p className="mt-4 text-base text-gray-200 sm:text-lg">
            {t("home.hero.subtitle")}
          </p>
          <Link href="/products" className="btn-primary mt-6 bg-white text-gray-900 hover:bg-gray-100">
            {t("home.shopNow")}
          </Link>
        </div>
      </section>

      {/* Featured */}
      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{t("home.featured")}</h2>
          <Link href="/products" className="text-sm font-semibold text-brand-accent hover:underline">
            {t("home.viewAll")} →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
