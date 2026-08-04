"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, CURRENCIES } from "@/components/I18nProvider";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/currency";

export default function CheckoutPage() {
  const { locale, currency, setCurrency, t } = useI18n();
  const { items, totalUSD, clear } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    country: "",
    zip: "",
  });

  useEffect(() => {
    if (items.length === 0 && !busy) {
      // allow redirect after submit; otherwise nudge to shop
    }
  }, [items, busy]);

  const submit = async () => {
    setError("");
    if (!form.email || !form.name || !form.address) {
      setError("Please fill in name, email and address.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          customer: form,
          currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      if (data.url) {
        window.location.href = data.url; // Stripe Checkout
      } else if (data.demo) {
        clear();
        router.push(`/checkout/success?order_id=${data.orderId}&demo=1`);
      }
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  };

  if (items.length === 0 && !busy) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("checkout.title")}</h1>
        <div className="mt-6 space-y-4">
          {(
            [
              ["name", t("checkout.name")],
              ["email", t("checkout.email")],
              ["address", t("checkout.address")],
              ["city", t("checkout.city")],
              ["country", t("checkout.country")],
              ["zip", t("checkout.zip")],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {label}
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-accent"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("checkout.currency")}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as typeof currency)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-accent"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <button onClick={submit} disabled={busy} className="btn-primary mt-6 w-full">
          {busy ? "..." : t("checkout.pay")} · {formatMoney(totalUSD, currency)}
        </button>
      </div>

      <div className="card h-fit p-6">
        <h2 className="font-semibold text-gray-900">Order summary</h2>
        <div className="mt-4 space-y-2">
          {items.map((i) => (
            <div key={i.productId} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {i.name[locale]} × {i.qty}
              </span>
              <span>{formatMoney(i.priceUSD * i.qty, currency)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t pt-4 font-bold text-gray-900">
          <span>{t("cart.subtotal")}</span>
          <span>{formatMoney(totalUSD, currency)}</span>
        </div>
      </div>
    </div>
  );
}
