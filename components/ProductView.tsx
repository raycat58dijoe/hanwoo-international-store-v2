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
    <div className="container-page grid gap-8 py-8 md:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[active] ?? product.images[0]}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {product.images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                  i === active ? "border-brand-accent" : "border-transparent"
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
      <div>
        <span className="text-xs uppercase tracking-wide text-gray-400">
          {product.category}
        </span>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">{name}</h1>
        <p className="mt-3 text-2xl font-bold text-gray-900">
          {formatMoney(product.priceUSD, currency)}
        </p>
        <p className="mt-4 text-gray-600">{desc}</p>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-gray-300">
            <button
              className="px-3 py-2 text-lg text-gray-600"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="w-10 text-center">{qty}</span>
            <button
              className="px-3 py-2 text-lg text-gray-600"
              onClick={() => setQty((q) => q + 1)}
            >
              +
            </button>
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
                  priceUSD: product.priceUSD,
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
      </div>
    </div>
  );
}
