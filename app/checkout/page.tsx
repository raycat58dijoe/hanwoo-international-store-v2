"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, CURRENCIES } from "@/components/I18nProvider";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/currency";
import type { PaymentMethod } from "@/lib/types";

export default function CheckoutPage() {
  const { locale, currency, setCurrency, t } = useI18n();
  const { items, totalUSD, clear } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Zelle flow state
  const [method, setMethod] = useState<PaymentMethod>("stripe");
  const [zelle, setZelle] = useState<{ id: string; amountUSD: number; currency: string; orderId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    country: "",
    zip: "",
  });

  useEffect(() => {
    if (items.length === 0 && !busy && !zelle) {
      // allow redirect after submit; otherwise nudge to shop
    }
  }, [items, busy, zelle]);

  const copyId = async () => {
    if (!zelle) return;
    try {
      await navigator.clipboard.writeText(zelle.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

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
          method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.method === "zelle") {
        setZelle(data.zelle);
        setBusy(false);
        return;
      }
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

  const confirmZelleSent = async () => {
    if (!zelle) return;
    setBusy(true);
    try {
      await fetch(`/api/orders/${zelle.orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zelleConfirmed: true }),
      });
      clear();
      router.push(`/checkout/success?order_id=${zelle.orderId}&method=zelle`);
    } catch {
      setBusy(false);
    }
  };

  // ---------- Zelle instructions view ----------
  if (zelle) {
    const amountStr = formatMoney(zelle.amountUSD, zelle.currency);
    return (
      <div className="container-page max-w-2xl py-10">
        <h1 className="text-2xl font-bold text-gray-900">{t("checkout.zelleTitle")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("checkout.zelleSub")}</p>

        <div className="card mt-6 space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">
              {t("checkout.zelleOurId")}
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800">
                {zelle.id}
              </code>
              <button onClick={copyId} className="btn-secondary whitespace-nowrap px-3 py-2 text-sm">
                {copied ? "✓" : t("checkout.copy")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("checkout.zelleAmount")}
              </label>
              <div className="rounded-lg bg-brand-accent/10 px-3 py-2 font-bold text-gray-900">
                {amountStr}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-400">
                {t("checkout.zelleMemo")}
              </label>
              <div className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800">
                {zelle.orderId}
              </div>
            </div>
          </div>

          <ol className="space-y-1 text-sm text-gray-600">
            <li>1. {t("checkout.zelleStep1")}</li>
            <li>2. {t("checkout.zelleStep2")}</li>
            <li>3. {t("checkout.zelleStep3")}</li>
          </ol>

          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {t("checkout.zelleNote")}
          </p>

          <button onClick={confirmZelleSent} disabled={busy} className="btn-primary w-full">
            {busy ? "..." : t("checkout.iSentZelle")}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Normal checkout view ----------
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

          {/* Payment method selector */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("checkout.method")}
            </label>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 p-3 has-[:checked]:border-brand-accent has-[:checked]:bg-brand-accent/5">
                <input
                  type="radio"
                  name="pm"
                  checked={method === "stripe"}
                  onChange={() => setMethod("stripe")}
                  className="accent-brand-accent"
                />
                <span className="text-sm text-gray-700">{t("checkout.method.stripe")}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 p-3 has-[:checked]:border-brand-accent has-[:checked]:bg-brand-accent/5">
                <input
                  type="radio"
                  name="pm"
                  checked={method === "zelle"}
                  onChange={() => setMethod("zelle")}
                  className="accent-brand-accent"
                />
                <span className="text-sm text-gray-700">{t("checkout.method.zelle")}</span>
              </label>
            </div>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <button onClick={submit} disabled={busy} className="btn-primary mt-6 w-full">
          {busy ? "..." : method === "zelle" ? t("checkout.zelleTitle") : `${t("checkout.pay")} · ${formatMoney(totalUSD, currency)}`}
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
