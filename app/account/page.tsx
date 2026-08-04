"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { formatMoney } from "@/lib/currency";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  failed: "Failed",
};
const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-purple-100 text-purple-700",
  failed: "bg-red-100 text-red-700",
};

function Timeline({ order }: { order: Order }) {
  const steps: { key: OrderStatus | "placed"; label: string; time?: string }[] = [
    { key: "placed", label: "Order placed", time: order.createdAt },
    { key: "paid", label: "Payment confirmed" },
    { key: "shipped", label: "Shipped", time: order.shippedAt },
    { key: "delivered", label: "Delivered" },
  ];
  const orderIdx: Record<OrderStatus, number> = { pending: 1, paid: 2, shipped: 3, delivered: 4, failed: 1 };
  const active = orderIdx[order.status] ?? 1;
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center">
        {steps.map((s, i) => {
          const done = i < active;
          const current = i === active - 1;
          return (
            <div key={s.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    done ? "bg-green-600 text-white" : current ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <div className="mt-1 text-center text-[11px] text-gray-600">{s.label}</div>
                {s.time && <div className="text-[10px] text-gray-400">{new Date(s.time).toLocaleDateString()}</div>}
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-1 mb-5 h-0.5 flex-1 ${i < active - 1 ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>
      {(order.status === "shipped" || order.status === "delivered") && order.trackingNumber && (
        <div className="mt-3 rounded bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Tracking:{" "}
          {order.trackingUrl ? (
            <a className="font-mono underline" href={order.trackingUrl} target="_blank" rel="noreferrer">
              {order.trackingNumber}
            </a>
          ) : (
            <span className="font-mono">{order.trackingNumber}</span>
          )}
        </div>
      )}
      {order.status === "pending" && order.paymentMethod === "zelle" && (
        <div className="mt-3 rounded bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Awaiting confirmation of your Zelle payment — we verify transfers within a few hours.
        </div>
      )}
    </div>
  );
}

function AccountInner() {
  const params = useSearchParams();
  const { t, locale } = useI18n();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [searchedFor, setSearchedFor] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  async function lookup(em: string) {
    const e = em.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true); setError(""); setOrders(null); setOpenId(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Lookup failed");
      setOrders(d.orders ?? []);
      setSearchedFor(e);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.get("email")) lookup(params.get("email")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-gray-900">{t("account.title") ?? "My Orders"}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {t("account.subtitle") ?? "Enter the email you used at checkout to see all your orders and delivery status."}
      </p>

      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); lookup(email); }}
      >
        <input
          type="email"
          className="input flex-1"
          placeholder={t("account.emailPlaceholder") ?? "your@email.com"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn-primary" disabled={loading || !email.trim()}>
          {loading ? "…" : (t("account.lookup") ?? "Find my orders")}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {orders !== null && orders.length === 0 && !error && (
        <div className="card mt-8 p-8 text-center">
          <div className="text-3xl">📭</div>
          <p className="mt-3 text-gray-600">
            {t("account.noOrders") ?? "No orders found for this email yet."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/products" className="btn-primary">{t("cart.continue")}</Link>
            <Link href="/contact" className="btn-secondary">{t("account.contact") ?? "Contact support"}</Link>
          </div>
        </div>
      )}

      {orders !== null && orders.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {orders.length} {orders.length === 1 ? "order" : "orders"} for <span className="font-semibold text-gray-900">{searchedFor}</span>
            </p>
            <Link href="/track" className="text-sm text-brand-accent hover:underline">
              {t("account.singleTrack") ?? "Track a single order by ID →"}
            </Link>
          </div>

          <div className="mt-4 space-y-4">
            {orders.map((o) => {
              const open = openId === o.id;
              return (
                <div key={o.id} className="card overflow-hidden">
                  <button
                    className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50"
                    onClick={() => setOpenId(open ? null : o.id)}
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-gray-900">{o.id}</div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {new Date(o.createdAt).toLocaleString()} · {o.items.reduce((s, i) => s + i.qty, 0)} items
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                      <span className="font-bold text-gray-900">${Number(o.amountUSD).toFixed(2)}</span>
                      <span className="text-gray-400">{open ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {open && (
                    <div className="space-y-4 border-t p-4">
                      <Timeline order={o} />

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="mb-1 text-xs font-semibold uppercase text-gray-400">Items</div>
                          <div className="space-y-2">
                            {o.items.map((it, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {it.image && <img src={it.image} alt="" className="h-10 w-10 rounded object-cover" />}
                                <div className="flex-1">
                                  <div className="truncate">{it.name[locale]}</div>
                                  <div className="text-xs text-gray-400">× {it.qty}</div>
                                </div>
                                <span>${(it.priceUSD * it.qty).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-semibold uppercase text-gray-400">Ship to</div>
                          <div className="text-sm text-gray-700">
                            <div>{o.customer?.name}</div>
                            <div>{o.customer?.address}</div>
                            <div>{o.customer?.city}{o.customer?.state ? `, ${o.customer.state}` : ""} {o.customer?.zip}</div>
                            <div>{o.customer?.country}</div>
                            {o.customer?.phone && <div className="mt-1 text-xs text-gray-400">{o.customer.phone}</div>}
                          </div>
                          <div className="mt-3 border-t pt-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                              <span>Subtotal</span>
                              <span>${(o.amountUSD - (o.shippingUSD ?? 0)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Shipping</span>
                              <span>{o.shippingUSD === 0 ? "Free" : `$${(o.shippingUSD ?? 0).toFixed(2)}`}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900">
                              <span>Total</span>
                              <span>${Number(o.amountUSD).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Link href={`/track?id=${o.id}`} className="text-sm text-brand-accent hover:underline">
                          {t("account.orderDetail") ?? "Track this order →"}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="container-page py-24 text-center text-gray-500">…</div>}>
      <AccountInner />
    </Suspense>
  );
}
