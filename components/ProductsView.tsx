"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { ProductCard } from "./ProductCard";

export function ProductsView({ products }: { products: Product[] }) {
  const { t } = useI18n();
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );
  const [cat, setCat] = useState<string>("all");

  const filtered = cat === "all" ? products : products.filter((p) => p.category === cat);

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t("shop.title")}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCat("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            cat === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {t("shop.all")}
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              cat === c ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
