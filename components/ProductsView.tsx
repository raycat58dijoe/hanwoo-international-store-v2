"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { ProductCard } from "./ProductCard";

const FILTER_GROUPS = [
  {
    key: "category",
    label: "Category",
    options: ["Charger", "Power Bank", "Cable", "Hub", "Earbuds", "Accessory"],
  },
  {
    key: "connector",
    label: "Connector",
    options: ["USB-C", "Lightning", "Micro-USB"],
  },
  {
    key: "capacity",
    label: "Capacity",
    options: ["10000mAh", "20000mAh", "65W", "100W", "140W"],
  },
  {
    key: "feature",
    label: "Feature",
    options: ["GaN", "PD 3.0", "QC 4.0", "MagSafe", "Wireless"],
  },
];

export function ProductsView({ products }: { products: Product[] }) {
  const { t } = useI18n();
  const [cat, setCat] = useState<string>("all");
  const [openFilter, setOpenFilter] = useState<string | null>("category");
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "newest">("newest");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  let filtered = cat === "all" ? products : products.filter((p) => p.category === cat);

  // Sort
  if (sort === "price-asc") filtered = [...filtered].sort((a, b) => a.priceUSD - b.priceUSD);
  else if (sort === "price-desc") filtered = [...filtered].sort((a, b) => b.priceUSD - a.priceUSD);

  const toggleFilter = (key: string) => setOpenFilter(openFilter === key ? null : key);

  return (
    <div className="container-page py-6">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a href="/">Home</a> &nbsp;/&nbsp; <span>{t("shop.title")}</span>
      </div>

      {/* Page title + sort */}
      <div className="flex items-end justify-between mt-2 mb-8">
        <h1 className="section-title">{t("shop.title")}</h1>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="sort-dropdown"
        >
          <option value="newest">Sort by</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>
      </div>

      {/* Main layout: sidebar + grid */}
      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside className="filter-sidebar hidden lg:block">
          <div className="filter-header">Filter</div>

          {/* Show All */}
          <div
            className={`filter-group ${cat === "all" ? "open" : ""}`}
            onClick={() => setCat("all")}
          >
            <div className="filter-group-title cursor-pointer">
              Show All
            </div>
          </div>

          {/* Category filter */}
          <div className={`filter-group ${openFilter === "category" ? "open" : ""}`}>
            <div className="filter-group-title" onClick={() => toggleFilter("category")}>
              Category
            </div>
            <div className="filter-options">
              {categories.map((c) => (
                <label
                  key={c}
                  className="filter-option"
                  onClick={(e) => { e.stopPropagation(); setCat(c); }}
                >
                  <input
                    type="radio"
                    name="cat"
                    checked={cat === c}
                    readOnly
                  />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Static filter groups */}
          {FILTER_GROUPS.slice(1).map((group) => (
            <div
              key={group.key}
              className={`filter-group ${openFilter === group.key ? "open" : ""}`}
            >
              <div className="filter-group-title" onClick={() => toggleFilter(group.key)}>
                {group.label}
              </div>
              <div className="filter-options">
                {group.options.map((opt) => (
                  <label key={opt} className="filter-option" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <p className="text-[var(--fg-muted)] py-12 text-center">{t("cart.empty")}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
