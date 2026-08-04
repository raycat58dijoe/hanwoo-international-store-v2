"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { ProductCard } from "./ProductCard";

export function HomeView({ products }: { products: Product[] }) {
  const { t } = useI18n();
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const bestSellers = products.slice(0, 6);
  const categories = Array.from(new Set(products.map((p) => p.category))).sort().slice(0, 8);

  return (
    <div>
      {/* Hero — dark product showcase */}
      <section className="hero-section">
        {/* Background product imagery (CSS pattern simulating tech products) */}
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 40% 50% at 20% 40%, rgba(163,230,53,.15) 0%, transparent 70%),
              radial-gradient(ellipse 30% 40% at 75% 30%, rgba(255,255,255,.08) 0%, transparent 60%),
              radial-gradient(ellipse 35% 45% at 55% 70%, rgba(163,230,53,.1) 0%, transparent 65%)
            `,
          }}
        />
        <div className="container-page hero-content py-20 sm:py-28">
          <div className="max-w-lg">
            <p className="text-[var(--accent)] text-xs font-bold tracking-widest uppercase mb-3">
              Hanwoo International Inc.
            </p>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
              {t("home.hero.title")}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-300 leading-relaxed">
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">
                {t("home.shopNow")} →
              </Link>
              <Link href="/products?category=featured" className="btn-dark">
                {t("nav.featured") ?? "Featured"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="container-page">
        <div className="breadcrumb">
          <Link href="/">Home</Link> &nbsp;/&nbsp; <span>Collections</span> &nbsp;/&nbsp; <span>Best Seller</span>
        </div>
      </div>

      {/* Best Seller Section */}
      <section className="container-page pb-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="section-title">Best Seller</h2>
          <Link href="/products" className="sort-dropdown">
            {t("home.viewAll")} →
          </Link>
        </div>

        <div className="flex gap-8">
          {/* Category quick links (desktop) */}
          <aside className="filter-sidebar hidden lg:block">
            <div className="filter-header">Shop by Category</div>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/products?category=${encodeURIComponent(c)}`}
                className="filter-option block"
              >
                {c}
              </Link>
            ))}
            <Link href="/products" className="filter-option block font-medium">
              View all →
            </Link>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {(featured.length > 0 ? featured : bestSellers).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* View all button */}
            <div className="mt-10 text-center">
              <Link href="/products" className="btn-outline">
                {t("home.viewAll")} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature banner */}
      <section className="bg-[var(--bg-subtle)] py-12">
        <div className="container-page text-center">
          <h3 className="text-xl font-bold text-[var(--fg-primary)] mb-2">
            Free International Shipping
          </h3>
          <p className="text-sm text-[var(--fg-muted)] max-w-md mx-auto">
            On all orders over US$80. Tracked & insured delivery to 150+ countries.
          </p>
        </div>
      </section>
    </div>
  );
}
