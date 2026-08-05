"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { formatMoney } from "@/lib/currency";
import type { Order, OrderStatus, OrderItem, Review } from "@/lib/types";

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
const RETURN_LABEL: Record<string, string> = {
  none: "",
  requested: "Return requested",
  approved: "Return approved",
  rejected: "Return declined",
  refunded: "Refunded",
};
const RETURN_CLASS: Record<string, string> = {
  requested: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  refunded: "bg-teal-100 text-teal-700",
};
const RETURN_REASONS = ["Changed my mind", "Item arrived damaged", "Wrong item sent", "Quality issue", "Other"];

function Timeline({ order }: { order: Order }) {
  const steps: { key: string; label: string; time?: string }[] = [
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
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-green-600 text-white" : current ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>
                  {done ? "✓" : i + 1}
                </div>
                <div className="mt-1 text-center text-[11px] text-gray-600">{s.label}</div>
                {s.time && <div className="text-[10px] text-gray-400">{new Date(s.time).toLocaleDateString()}</div>}
              </div>
              {i < steps.length - 1 && <div className={`mx-1 mb-5 h-0.5 flex-1 ${i < active - 1 ? "bg-green-500" : "bg-gray-200"}`} />}
            </div>
          );
        })}
      </div>
      {(order.status === "shipped" || order.status === "delivered") && order.trackingNumber && (
        <div className="mt-3 rounded bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Tracking:{" "}
          {order.trackingUrl ? (
            <a className="font-mono underline" href={order.trackingUrl} target="_blank" rel="noreferrer">{order.trackingNumber}</a>
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

function Stars({ value, onChange, size = "text-2xl" }: { value: number; onChange?: (v: number) => void; size?: string }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          className={`${size} ${i <= value ? "text-amber-400" : "text-gray-300"} ${onChange ? "cursor-pointer" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewModal({ order, item, onClose, onDone }: { order: Order; item: OrderItem; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId, orderId: order.id, rating, comment }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to submit");
      onDone(); onClose();
    } catch (e: any) {
      setErr(e.message); setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900">{t("account.reviewTitle") ?? "Review product"}</h3>
        <p className="mt-1 text-sm text-gray-500">{item.name?.en}</p>
        <div className="mt-4">
          <div className="mb-1 text-sm font-medium text-gray-700">{t("account.rating") ?? "Your rating"}</div>
          <Stars value={rating} onChange={setRating} />
        </div>
        <div className="mt-4">
          <div className="mb-1 text-sm font-medium text-gray-700">{t("account.comment") ?? "Your review"}</div>
          <textarea
            className="input"
            rows={4}
            placeholder={t("account.commentPlaceholder") ?? "Share your experience with this product…"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
        <div className="mt-4 flex gap-2">
          <button className="btn-primary flex-1" disabled={busy} onClick={submit}>{busy ? "…" : (t("account.submit") ?? "Submit review")}</button>
          <button className="btn-secondary" onClick={onClose}>{t("account.cancel") ?? "Cancel"}</button>
        </div>
      </div>
    </div>
  );
}

function ReturnModal({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnRequested: true, returnReason: `${reason}: ${detail}` }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to submit");
      onDone(); onClose();
    } catch (e: any) {
      setErr(e.message); setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900">{t("account.returnTitle") ?? "Request a return"}</h3>
        <p className="mt-1 text-sm text-gray-500">{order.id}</p>
        <div className="mt-4">
          <div className="mb-1 text-sm font-medium text-gray-700">{t("account.returnReason") ?? "Reason"}</div>
          <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
            {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="mt-3">
          <div className="mb-1 text-sm font-medium text-gray-700">{t("account.returnDetail") ?? "Details"}</div>
          <textarea className="input" rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} />
        </div>
        {err && <p className="mt-2 text-sm text-red-500">{err}</p>}
        <div className="mt-4 flex gap-2">
          <button className="btn-primary flex-1" disabled={busy} onClick={submit}>{busy ? "…" : (t("account.submit") ?? "Submit request")}</button>
          <button className="btn-secondary" onClick={onClose}>{t("account.cancel") ?? "Cancel"}</button>
        </div>
      </div>
    </div>
  );
}

function AccountInner() {
  const params = useSearchParams();
  const { t, locale } = useI18n();
  const [email, setEmail] = useState(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem("acc_email") ?? params.get("email") ?? "")
      : (params.get("email") ?? "")
  );
  const [loggedIn, setLoggedIn] = useState(
    () => typeof window !== "undefined" && !!localStorage.getItem("acc_email")
  );
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [searchedFor, setSearchedFor] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "pending" | "paid" | "shipped" | "toReview" | "returns">("all");
  const [reviewsByOrder, setReviewsByOrder] = useState<Record<string, string[]>>({});
  const [reviewTarget, setReviewTarget] = useState<{ order: Order; item: OrderItem } | null>(null);
  const [returnTarget, setReturnTarget] = useState<Order | null>(null);

  async function lookup(em: string) {
    const e = em.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { setError("Please enter a valid email address."); return; }
    setLoading(true); setError(""); setOrders(null); setOpenId(null); setTab("all"); setReviewsByOrder({});
    try {
      const res = await fetch("/api/orders/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Lookup failed");
      const list: Order[] = d.orders ?? [];
      setOrders(list); setSearchedFor(e);
      // fetch reviews for delivered orders to know which items were reviewed
      const map: Record<string, string[]> = {};
      await Promise.all(list.filter((o) => o.status === "delivered").map(async (o) => {
        try {
          const r = await (await fetch(`/api/reviews?orderId=${o.id}`)).json();
          map[o.id] = (r.reviews ?? []).map((rv: Review) => rv.productId);
        } catch { map[o.id] = []; }
      }));
      setReviewsByOrder(map);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  // Guest login: email is the identity (no password). Remembered in localStorage.
  function login(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError("Please enter a valid email address."); return; }
    const em = email.trim().toLowerCase();
    localStorage.setItem("acc_email", em);
    setLoggedIn(true);
    lookup(em);
  }

  function logout() {
    localStorage.removeItem("acc_email");
    setLoggedIn(false); setOrders(null); setEmail(""); setError("");
  }

  useEffect(() => {
    const em = typeof window !== "undefined" ? localStorage.getItem("acc_email") : null;
    if (em) lookup(em);
    else if (params.get("email")) {
      const p = params.get("email")!;
      localStorage.setItem("acc_email", p);
      setLoggedIn(true);
      lookup(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0, pending: 0, paid: 0, shipped: 0, toReview: 0, returns: 0 };
    for (const o of orders ?? []) {
      if (o.status === "pending") c.pending++;
      if (o.status === "paid") c.paid++;
      if (o.status === "shipped") c.shipped++;
      if (o.returnRequested) c.returns++;
      if (o.status === "delivered") {
        const reviewed = new Set(reviewsByOrder[o.id] ?? []);
        if ((o.items ?? []).some((it) => !reviewed.has(it.productId))) c.toReview++;
      }
    }
    return c;
  }, [orders, reviewsByOrder]);

  const shown = useMemo(() => {
    const list = orders ?? [];
    const reviewed = new Set(reviewsByOrder[openId ?? ""] ?? []);
    return list.filter((o) => {
      if (tab === "pending") return o.status === "pending";
      if (tab === "paid") return o.status === "paid";
      if (tab === "shipped") return o.status === "shipped";
      if (tab === "returns") return o.returnRequested === true;
      if (tab === "toReview") return o.status === "delivered" && (o.items ?? []).some((it) => !reviewed.has(it.productId));
      return true;
    });
  }, [orders, tab, reviewsByOrder, openId]);

  const profile = orders?.[0]?.customer;

  const TABS: { key: typeof tab; label: string }[] = [
    { key: "all", label: t("account.tabAll") ?? "All" },
    { key: "pending", label: t("account.tabPending") ?? "To pay" },
    { key: "paid", label: t("account.tabPaid") ?? "To ship" },
    { key: "shipped", label: t("account.tabShipped") ?? "Shipped" },
    { key: "toReview", label: t("account.tabToReview") ?? "To review" },
    { key: "returns", label: t("account.tabReturns") ?? "Returns" },
  ];

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold text-gray-900">{t("account.title") ?? "My Account"}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {loggedIn
          ? (t("account.loggedInSub") ?? "Welcome back! Here are your orders.")
          : (t("account.subtitle") ?? "Sign in with your email to manage your orders — no password needed.")}
      </p>

      {!loggedIn ? (
        <>
          {/* Guest login card */}
          <form className="card mt-6 p-6" onSubmit={login}>
            <div className="flex gap-2">
              <input
                type="email"
                className="input flex-1"
                placeholder={t("account.emailPlaceholder") ?? "your@email.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn-primary" disabled={loading || !email.trim()}>
                {loading ? "…" : (t("account.loginBtn") ?? "Sign in")}
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              {t("account.guestHint") ?? "Guest sign-in: enter your email to view your orders and place new ones. No password or registration needed."}
            </p>
          </form>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </>
      ) : (
        <>
          {/* Signed-in header */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              {t("account.signedInAs") ?? "Signed in as"}:{" "}
              <span className="font-semibold text-gray-900">{searchedFor || email}</span>
            </p>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-red-600 hover:underline">
              {t("account.logout") ?? "Sign out"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

          {orders !== null && orders.length === 0 && (
            <div className="card mt-4 p-8 text-center">
              <div className="text-3xl">📭</div>
              <p className="mt-3 text-gray-600">{t("account.noOrders") ?? "No orders yet — start shopping!"}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link href="/products" className="btn-primary">{t("cart.continue")}</Link>
                <Link href="/contact" className="btn-secondary">{t("account.contact") ?? "Contact support"}</Link>
              </div>
            </div>
          )}

          {orders !== null && orders.length > 0 && (
            <>
              {/* Profile card */}
              {profile && (
                <div className="card mt-4 flex flex-wrap items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent/10 text-lg font-bold text-brand-accent">
                    {profile.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">{profile.name}</div>
                    <div className="text-sm text-gray-400">{profile.email}</div>
                  </div>
                  <div className="ml-auto text-right text-sm text-gray-500">
                    <div>{counts.all} {counts.all === 1 ? "order" : "orders"}</div>
                    <div>{counts.toReview > 0 && <span className="text-amber-600">{counts.toReview} pending review</span>}</div>
                  </div>
                </div>
              )}

              {/* Status tabs */}
              <div className="mt-6 flex gap-1.5 overflow-x-auto border-b border-gray-200 pb-0">
                {TABS.map((tb) => (
                  <button
                    key={tb.key}
                    onClick={() => setTab(tb.key)}
                    className={`whitespace-nowrap px-3 py-2 text-sm font-medium ${tab === tb.key ? "border-b-2 border-brand-accent text-gray-900" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    {tb.label}{counts[tb.key] > 0 && <span className="ml-1 rounded-full bg-brand-accent/10 px-1.5 py-0.5 text-xs text-brand-accent">{counts[tb.key]}</span>}
                  </button>
                ))}
              </div>

              {/* Orders */}
              <div className="mt-4 space-y-4">
                {shown.length === 0 && <p className="py-10 text-center text-sm text-gray-400">{t("account.noInTab") ?? "No orders in this category."}</p>}
                {shown.map((o) => {
                  const open = openId === o.id;
                  const reviewed = new Set(reviewsByOrder[o.id] ?? []);
                  const unreviewedItems = o.status === "delivered" ? (o.items ?? []).filter((it) => !reviewed.has(it.productId)) : [];
              return (
                <div key={o.id} className="card overflow-hidden">
                  <button className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-gray-50" onClick={() => setOpenId(open ? null : o.id)}>
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-gray-900">{o.id}</div>
                      <div className="mt-0.5 text-xs text-gray-400">{new Date(o.createdAt).toLocaleString()} · {o.items.reduce((s, i) => s + i.qty, 0)} items</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {o.returnRequested && o.returnStatus && o.returnStatus !== "none" && (
                        <span className={`rounded px-2 py-0.5 text-xs ${RETURN_CLASS[o.returnStatus]}`}>{RETURN_LABEL[o.returnStatus]}</span>
                      )}
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
                            {o.items.map((it) => {
                              const hasRev = reviewed.has(it.productId);
                              return (
                                <div key={it.productId} className="flex items-center gap-2 text-sm text-gray-700">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  {it.image && <img src={it.image} alt="" className="h-10 w-10 rounded object-cover" />}
                                  <div className="flex-1">
                                    <div className="truncate">{it.name[locale]}</div>
                                    <div className="text-xs text-gray-400">× {it.qty} · ${it.priceUSD.toFixed(2)}</div>
                                  </div>
                                  <span>
                                    {o.status === "delivered" ? (
                                      hasRev ? (
                                        <span className="text-xs text-green-600">✓ Reviewed</span>
                                      ) : (
                                        <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setReviewTarget({ order: o, item: it })}>
                                          {t("account.reviewBtn") ?? "Review"}
                                        </button>
                                      )
                                    ) : (
                                      <span className="font-semibold">${(it.priceUSD * it.qty).toFixed(2)}</span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
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
                            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${(o.amountUSD - (o.shippingUSD ?? 0)).toFixed(2)}</span></div>
                            <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{o.shippingUSD === 0 ? "Free" : `$${(o.shippingUSD ?? 0).toFixed(2)}`}</span></div>
                            <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>${Number(o.amountUSD).toFixed(2)}</span></div>
                          </div>
                        </div>
                      </div>

                      {/* After-sales actions */}
                      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                        {o.status === "delivered" && !o.returnRequested && (
                          <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setReturnTarget(o)}>
                            {t("account.returnBtn") ?? "Request return / after-sales"}
                          </button>
                        )}
                        {o.returnRequested && o.returnStatus && (
                          <span className={`rounded px-2 py-1 text-xs font-medium ${RETURN_CLASS[o.returnStatus]}`}>{RETURN_LABEL[o.returnStatus]}</span>
                        )}
                        {o.returnRequested && o.returnReason && o.returnStatus !== "none" && (
                          <span className="text-xs text-gray-400">{o.returnReason}</span>
                        )}
                        <Link href={`/track?id=${o.id}`} className="ml-auto text-sm text-brand-accent hover:underline">
                          {t("account.orderDetail") ?? "Track this order →"}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
        </>
      )}

      {reviewTarget && <ReviewModal order={reviewTarget.order} item={reviewTarget.item} onClose={() => setReviewTarget(null)} onDone={() => lookup(searchedFor)} />}
      {returnTarget && <ReturnModal order={returnTarget} onClose={() => setReturnTarget(null)} onDone={() => lookup(searchedFor)} />}
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
