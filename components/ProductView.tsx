"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/currency";

export function ProductView({ product }: { product: Product }) {
  const { locale, currency, t } = useI18n();
  const { add } = useCart();
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  const name = product.name[locale];
  const desc = product.description[locale];

  return (
    <div className="container-page py-6">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a href="/">Home</a> &nbsp;/&nbsp; <a href="/products">Shop</a> &nbsp;/&nbsp; <span>{name}</span>
      </div>

      <div className="grid gap-10 py-8 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="product-card-image-wrap rounded-xl" style={{ aspectRatio: "1/1" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images[active] ?? product.images[0]}
              alt={name}
              className="product-card-image"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition ${
                    i === active ? "border-[var(--accent)]" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.featured && (
            <span className="badge-new inline-block w-fit mb-3">NEW</span>
          )}
          <span className="text-xs font-bold tracking-widest uppercase text-[var(--fg-muted)]">
            {product.category}
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-[var(--fg-primary)] leading-tight">
            {name}
          </h1>

          {/* Rating placeholder */}
          <div className="mt-2 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
            <span className="ml-1 text-xs text-[var(--fg-muted)]">(128 reviews)</span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <p className="text-2xl font-bold text-[var(--fg-primary)]">
              {formatMoney(product.salePriceUSD ?? product.priceUSD, currency)}
            </p>
            {product.salePriceUSD != null && product.salePriceUSD < product.priceUSD && (
              <>
                <p className="text-base text-[var(--fg-muted)] line-through">
                  {formatMoney(product.priceUSD, currency)}
                </p>
                <span className="rounded bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-600">
                  -{Math.round((1 - product.salePriceUSD / product.priceUSD) * 100)}%
                </span>
              </>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[var(--fg-secondary)]">
            {desc}
          </p>

          {/* Features list */}
          <ul className="mt-4 space-y-1.5 text-sm text-[var(--fg-secondary)]">
            <li className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Free international shipping over $80
            </li>
            <li className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              2-year manufacturer warranty
            </li>
            <li className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              30-day hassle-free returns
            </li>
          </ul>

          {/* Quantity + Add to cart */}
          <div className="mt-8 flex items-center gap-3">
            <div className="qty-selector">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}>+</button>
            </div>
            <button
              disabled={product.inventory <= 0}
              onClick={() => {
                add(
                  {
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    image: product.images[0] ?? "",
                    priceUSD: product.salePriceUSD ?? product.priceUSD,
                  },
                  qty
                );
                router.push("/cart");
              }}
              className="btn-primary flex-1"
            >
              {product.inventory <= 0 ? t("product.outOfStock") : t("product.addToCart")}
            </button>
          </div>

          {/* Stock status */}
          <p className="mt-3 text-xs text-[var(--fg-muted)]">
            {product.inventory > 50
              ? "✓ In stock — ships within 24 hours"
              : product.inventory > 0
                ? `Only ${product.inventory} left in stock`
                : "Out of stock"}
          </p>
        </div>
      </div>
    </div>
  );
}
