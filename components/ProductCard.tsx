"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/currency";

export function ProductCard({ product }: { product: Product }) {
  const { locale, currency, t } = useI18n();
  const { add } = useCart();
  const name = product.name[locale];
  const image = product.images[0] ?? "";

  return (
    <div className="card flex flex-col overflow-hidden transition hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block aspect-square overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition hover:scale-105"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs uppercase tracking-wide text-gray-400">
          {product.category}
        </span>
        <Link
          href={`/products/${product.slug}`}
          className="mt-1 line-clamp-2 font-semibold text-gray-900 hover:text-brand-accent"
        >
          {name}
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            {formatMoney(product.priceUSD, currency)}
          </span>
        </div>
        <button
          disabled={product.inventory <= 0}
          onClick={() =>
            add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image,
              priceUSD: product.priceUSD,
            })
          }
          className="btn-primary mt-3 w-full"
        >
          {product.inventory <= 0 ? t("product.outOfStock") : t("product.addToCart")}
        </button>
      </div>
    </div>
  );
}
