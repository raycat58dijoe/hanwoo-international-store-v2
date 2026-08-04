"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/currency";

// Color palette for variant dots
const COLOR_SWATCHES: Record<string, string[]> = {
  default: ["#1a1a1a", "#8b7355", "#c0c0c0", "#4a5568"],
  charger: ["#ffffff", "#1a1a1a", "#3b82f6", "#8b5cf6"],
  "power bank": ["#1a1a1a", "#f5f5f4", "#3b82f6"],
  earbuds: ["#ffffff", "#1a1a1a", "#f59e0b"],
  headphone: ["#1a1a1a", "#f5f5f4", "#3b82f6"],
  speaker: ["#1a1a1a", "#4a5568", "#dc2626"],
  hub: ["#1a1a1a", "#c0c0c0"],
  cable: ["#ffffff", "#1a1a1a"],
  watch: ["#1a1a1a", "#c0c0c0", "#3b82f6"],
  storage: ["#1a1a1a", "#c0c0c0", "#8b5cf6"],
  keyboard: ["#1a1a1a", "#f5f5f4", "#3b82f6"],
  mouse: ["#1a1a1a", "#f5f5f4", "#8b5cf6"],
  gaming: ["#1a1a1a", "#dc2626", "#16a34a"],
};

export function ProductCard({ product }: { product: Product }) {
  const { locale, currency, t } = useI18n();
  const { add } = useCart();
  const name = product.name[locale];
  const image = product.images[0] ?? "";
  const isNew = product.featured;
  const colors = COLOR_SWATCHES[product.category] || COLOR_SWATCHES.default;

  return (
    <div className="product-card group">
      {/* NEW badge */}
      {isNew && <span className="badge-new">NEW</span>}

      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block product-card-image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={name}
          className="product-card-image"
          loading="lazy"
        />
      </Link>

      {/* Info */}
      <div className="product-card-info">
        {/* Color dots */}
        <div className="flex gap-1.5 mb-2">
          {colors.slice(0, 4).map((c, i) => (
            <span
              key={i}
              className={`color-dot ${i === 0 ? "active" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Name */}
        <Link
          href={`/products/${product.slug}`}
          className="product-card-name line-clamp-2 hover:text-[var(--fg-primary)]"
        >
          {name}
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2">
          <div className="product-card-price">
            {formatMoney(product.salePriceUSD ?? product.priceUSD, currency)}
          </div>
          {product.salePriceUSD != null && product.salePriceUSD < product.priceUSD && (
            <>
              <span className="text-sm text-[var(--fg-muted)] line-through">
                {formatMoney(product.priceUSD, currency)}
              </span>
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-600">
                -{Math.round((1 - product.salePriceUSD / product.priceUSD) * 100)}%
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
