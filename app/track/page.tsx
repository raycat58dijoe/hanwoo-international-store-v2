"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { formatMoney } from "@/lib/currency";
import type { Order } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  failed: "Failed",
};
const STATUS_CLASS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-purple-100 text-purple-700",
  failed: "bg-red-100 text-red-700",
};

function TrackInner() {
  const params = useSearchParams();
  const { t, locale } = useI18n();
  const [orderId, setOrderId] = useState(params.get("id") ?? "");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookup(id: string) {
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/${id}`);
      const d = await res.json();
      if (d.order) setOrder(d.order);
      else setError(t("track.notFound") ?? "Order not found.");
    } catch {
      setError(t("track.error") ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.get("id")) lookup(params.get("id")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="text-2xl font-bold text-gray-900">{t("track.title") ?? "Track your order"}</h1>
      <p className="mt-2 text-sm text-gray-500">{t("track.subtitle") ?? "Enter your order ID to see the latest status."}</p>

      <div className="mt-4 flex gap-2">
        <input
          className="input flex-1"
          placeholder={t("track.placeholder") ?? "Order ID (e.g. ord_...)"}
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <button className="btn-primary" disabled={!orderId} onClick={() => lookup(orderId)}>
          {t("track.search") ?? "Track"}
        </button>
      </div>

      {loading && <p className="mt-4 text-gray-400">…</p>}
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {order && (
        <div className="card mt-6 p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-gray-900">{order.id}</span>
            <span className={`rounded px-2 py-0.5 text-xs ${STATUS_CLASS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>

          {(order.status === "shipped" || order.status === "delivered") && (
            <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <div className="font-semibold">
                {order.status === "delivered" ? (t("success.delivered") ?? "Delivered") : (t("success.shipped") ?? "Shipped")}
              </div>
              {order.trackingNumber && (
                <div className="mt-1">
                  {t("success.tracking") ?? "Tracking"}:{" "}
                  {order.trackingUrl ? (
                    <a className="font-mono underline" href={order.trackingUrl} target="_blank" rel="noreferrer">
                      {order.trackingNumber}
                    </a>
                  ) : (
                    <span className="font-mono">{order.trackingNumber}</span>
                  )}
                </div>
              )}
              {order.shippedAt && (
                <div className="mt-1 text-xs text-blue-600">
                  {new Date(order.shippedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {order.status === "pending" && order.paymentMethod === "zelle" && (
            <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {t("track.zellePending") ?? "Awaiting Zelle payment confirmation."}
            </div>
          )}

          <div className="mt-6 space-y-2 text-left">
            {order.items.map((it) => (
              <div key={it.productId} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {it.name[locale]} × {it.qty}
                </span>
                <span>{formatMoney(it.priceUSD * it.qty, order.currency)}</span>
              </div>
            ))}
            {order.shippingUSD != null && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>{t("checkout.shipping") ?? "Shipping"}</span>
                <span>{order.shippingUSD === 0 ? (t("checkout.shippingFree") ?? "Free") : formatMoney(order.shippingUSD, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-bold text-gray-900">
              <span>Total</span>
              <span>{formatMoney(order.amountUSD, order.currency)}</span>
            </div>
          </div>
        </div>
      )}

      <Link href="/" className="btn-secondary mt-8">
        {t("success.backHome")}
      </Link>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="container-page py-24 text-center text-gray-500">…</div>}>
      <TrackInner />
    </Suspense>
  );
}
