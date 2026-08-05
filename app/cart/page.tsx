"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/currency";
import { SHIPPING_THRESHOLD, SHIPPING_FLAT_USD } from "@/lib/shipping";
import type { Product } from "@/lib/types";

export default function CartPage() {
  const { locale, currency, t } = useI18n();
  const { items, setQty, remove, totalUSD } = useCart();
  const [stock, setStock] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, number> = {};
        (d.products ?? []).forEach((p: Product) => { map[p.id] = p.inventory; });
        setStock(map);
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t("cart.title")}</h1>
        <p className="mt-4 text-gray-500">{t("cart.empty")}</p>
        <Link href="/products" className="btn-primary mt-6">
          {t("cart.continue")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t("cart.title")}</h1>

      {/* Free-shipping progress bar */}
      {totalUSD < SHIPPING_THRESHOLD ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-amber-800">
              (t("cart.freeShipProgress") ?? "Add {amount} more to get free shipping").replace("{amount}", formatMoney(SHIPPING_THRESHOLD - totalUSD, "USD"))
            </span>
            <span className="text-amber-600">{formatMoney(totalUSD, "USD")} / {formatMoney(SHIPPING_THRESHOLD, "USD")}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-amber-200">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: Math.min(100, (totalUSD / SHIPPING_THRESHOLD) * 100) + "%" }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">{t("cart.freeShipReached")}</p>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((it) => {
            const max = stock[it.productId] ?? Infinity;
            const atMax = it.qty >= max;
            return (
              <div key={it.productId} className="card flex gap-4 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image}
                  alt=""
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <div className="flex flex-1 flex-col">
                  <span className="font-semibold text-gray-900">{it.name[locale]}</span>
                  <span className="text-sm text-gray-500">
                    {formatMoney(it.priceUSD, currency)}
                  </span>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-gray-300">
                      <button
                        className="px-3 py-1"
                        onClick={() => setQty(it.productId, it.qty - 1)}
                      >
                        −
                      </button>
                      <span className="w-8 text-center">{it.qty}</span>
                      <button
                        className="px-3 py-1 disabled:opacity-30"
                        disabled={atMax}
                        onClick={() => setQty(it.productId, it.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    {atMax && max !== Infinity && (
                      <span className="text-xs text-amber-600">Max {max} in stock</span>
                    )}
                    <button
                      onClick={() => remove(it.productId)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                </div>
                <div className="font-bold text-gray-900">
                  {formatMoney(it.priceUSD * it.qty, currency)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card h-fit p-6">
          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>{t("cart.subtotal")}</span>
            <span>{formatMoney(totalUSD, currency)}</span>
          </div>
          <Link href="/checkout" className="btn-primary mt-6 w-full">
            {t("cart.checkout")}
          </Link>
          <Link
            href="/products"
            className="btn-secondary mt-3 w-full"
          >
            {t("cart.continue")}
          </Link>
        </div>
      </div>
    </div>
  );
}
