"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { ProductCard } from "./ProductCard";
import { categoryLabel } from "@/lib/categories";

export type SortKey = "newest" | "price-asc" | "price-desc";

export function ProductsView({
  products,
  initialCategory = "all",
  initialQuery = "",
  initialSort = "newest",
}: {
  products: Product[];
  initialCategory?: string;
  initialQuery?: string;
  initialSort?: SortKey;
}) {
  const { t, locale } = useI18n();
  const [cat, setCat] = useState<string>(initialCategory || "all");
  const [query, setQuery] = useState<string>(initialQuery ?? "");
  const [sort, setSort] = useState<SortKey>((initialSort as SortKey) || "newest");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );

  const eff = (p: Product) => p.salePriceUSD ?? p.priceUSD;

  const filtered = useMemo(() => {
    let list = products;
    // category filter ("featured" is a virtual bucket → featured flag)
    if (cat === "featured") list = list.filter((p) => p.featured);
    else if (cat !== "all") list = list.filter((p) => p.category === cat);
    // text search across name / description / category / tags
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [
          p.name.en, p.name.zh, p.description?.en, p.description?.zh,
          p.category, p.sku ?? "", ...(p.tags ?? []),
        ].some((s) => s?.toLowerCase().includes(q))
      );
    }
    // sort
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => eff(a) - eff(b));
    else if (sort === "price-desc") sorted.sort((a, b) => eff(b) - eff(a));
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, cat, query, sort]);

  return (
    <div className="container-page py-6">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a href="/">Home</a> &nbsp;/&nbsp; <span>{t("shop.title")}</span>
        {query.trim() && <span> &nbsp;/&nbsp; Search: “{query.trim()}”</span>}
      </div>

      {/* Page title + sort */}
      <div className="flex flex-wrap items-end justify-between gap-3 mt-2 mb-8">
        <h1 className="section-title">
          {query.trim() ? `${t("shop.title")} — “${query.trim()}”` : cat === "featured" ? (t("nav.featured") ?? "Featured") : t("shop.title")}
        </h1>
        <div className="flex items-center gap-2">
          <input
            className="input w-52 md:w-64"
            placeholder={t("search.placeholder") ?? "Search products…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="sort-dropdown"
          >
            <option value="newest">Sort by</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      {/* Main layout: sidebar + grid */}
      <div className="flex gap-8">
        {/* Sidebar: real categories only */}
        <aside className="filter-sidebar hidden lg:block">
          <div className="filter-header">{t("shop.filterHeader")}</div>

          <div
            className={`filter-group ${cat === "all" ? "open" : ""}`}
            onClick={() => setCat("all")}
          >
            <div className="filter-group-title cursor-pointer">{t("shop.showAll")}</div>
          </div>

          <div className={`filter-group ${cat === "featured" ? "open" : ""}`} onClick={() => setCat("featured")}>
            <div className="filter-group-title cursor-pointer">{t("nav.featured")}</div>
          </div>

          <div className="filter-group open">
            <div className="filter-group-title">{t("shop.categoryLabel")}</div>
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
                  <span>{categoryLabel(c, locale)}</span>
                </label>
              ))}
            </div>
          </div>
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
