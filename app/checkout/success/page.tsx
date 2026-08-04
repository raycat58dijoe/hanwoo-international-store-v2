"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { formatMoney } from "@/lib/currency";
import type { Order } from "@/lib/types";

function SuccessInner() {
  const params = useSearchParams();
  const { t, locale } = useI18n();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "paid" | "pending" | "shipped" | "delivered" | "error">("loading");
  const method = params.get("method");

  useEffect(() => {
    const orderId = params.get("order_id");
    const demo = params.get("demo");
    const sessionId = params.get("session_id");
    const method = params.get("method");
    if (!orderId) {
      setState("error");
      return;
    }
    const body: Record<string, unknown> = demo ? { demo: true } : method === "zelle" ? { zelleConfirmed: true } : { sessionId };
    fetch(`/api/orders/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.order) {
          setOrder(d.order);
          setState(d.order.status as typeof state);
        } else {
          setState("error");
        }
      })
      .catch(() => setState("error"));
  }, [params]);

  if (state === "loading") {
    return <div className="container-page py-24 text-center text-gray-500">…</div>;
  }
  if (state === "error" || !order) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-gray-500">Order not found.</p>
        <Link href="/" className="btn-primary mt-6">
          {t("success.backHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-16">
      <div className="card p-8 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">{t("success.title")}</h1>
        <p className="mt-2 text-gray-500">{t("success.subtitle")}</p>
        <p className="mt-2 text-sm text-gray-400">
          {t("success.orderId")}: <span className="font-mono">{order.id}</span>
        </p>

        {method === "zelle" && state === "pending" && (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {t("success.zellePending")}
          </div>
        )}
        {state === "paid" && method === "zelle" && (
          <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {t("success.zelleConfirmed")}
          </div>
        )}

        {(state === "shipped" || state === "delivered") && (
          <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm text-blue-800">
            <div className="font-semibold">
              {state === "delivered" ? (t("success.delivered") ?? "Delivered") : (t("success.shipped") ?? "Shipped")}
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
          <div className="flex justify-between border-t pt-2 font-bold text-gray-900">
            <span>Total</span>
            <span>{formatMoney(order.amountUSD, order.currency)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Link href={`/track?id=${order.id}`} className="btn-secondary">
            {t("success.trackOrder") ?? "Track this order"}
          </Link>
          <Link href="/" className="text-sm text-brand-accent hover:underline">
            {t("success.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="container-page py-24 text-center text-gray-500">…</div>}>
      <SuccessInner />
    </Suspense>
  );
}
