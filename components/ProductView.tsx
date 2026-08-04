"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, Review } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/currency";

export function ProductView({ product }: { product: Product }) {
  const { locale, currency, t } = useI18n();
  const { add } = useCart();
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch(`/api/reviews?productId=${product.id}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch(() => {});
  }, [product.id]);

  const name = product.name[locale];
  const desc = product.description[locale];
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

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

          {/* Rating — real reviews */}
          <div className="mt-2 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.round(avg) ? "#f59e0b" : "#d1d5db"} stroke={i < Math.round(avg) ? "#f59e0b" : "#d1d5db"} strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
            <span className="ml-1 text-xs text-[var(--fg-muted)]">
              {reviews.length > 0 ? `${avg.toFixed(1)} (${reviews.length} review${reviews.length === 1 ? "" : "s"})` : "No reviews yet"}
            </span>
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

      {/* Reviews */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-[var(--fg-primary)]">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--fg-muted)]">
            No reviews yet. Purchased this product? You can leave a review from your account page after delivery.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-[var(--border)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-sm font-bold text-[var(--fg-primary)]">
                      {r.customerName?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                    <span className="text-sm font-medium text-[var(--fg-primary)]">{r.customerName}</span>
                  </div>
                  <span className="text-xs text-[var(--fg-muted)]">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${i < r.rating ? "text-amber-400" : "text-gray-300"}`}>★</span>
                  ))}
                </div>
                {r.comment && <p className="mt-2 text-sm leading-relaxed text-[var(--fg-secondary)]">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
