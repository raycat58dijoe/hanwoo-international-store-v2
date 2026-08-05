"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, CURRENCIES } from "@/components/I18nProvider";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/currency";
import { SHIPPING_THRESHOLD, SHIPPING_FLAT_USD } from "@/lib/shipping";
import { regionsForCountry, CHECKOUT_COUNTRIES, isValidPostalCode } from "@/lib/regions";
import { getCitiesByState } from "@/lib/us-cities";
import type { PaymentMethod } from "@/lib/types";

type AddressSuggestion = { display: string; address: string; city: string; state: string; zip: string };

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
  const [zipLoading, setZipLoading] = useState(false);
  const [zipFilled, setZipFilled] = useState(false);

  // Address autocomplete & city-by-state
  const [addrSuggestions, setAddrSuggestions] = useState<AddressSuggestion[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const addrTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addrRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: typeof window !== "undefined" ? (localStorage.getItem("acc_email") ?? "") : "",
    address: "",
    city: "",
    state: "",
    country: "US",
    zip: "",
    phone: "",
  });

  useEffect(() => {
    if (items.length === 0 && !busy && !zelle) {
      // allow redirect after submit; otherwise nudge to shop
    }
  }, [items, busy, zelle]);

  // Load city options when state changes
  useEffect(() => { loadCitiesForState(form.country, form.state); }, [form.country, form.state]);

  // Close address dropdown on outside click
  useEffect(() => {
    if (!addrOpen) return;
    const handler = (e: MouseEvent) => {
      if (addrRef.current && !addrRef.current.contains(e.target as Node)) setAddrOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addrOpen]);

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
    const regions = regionsForCountry(form.country);
    const missing: string[] = [];
    if (!form.name.trim()) missing.push("name");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) missing.push("email");
    if (!form.address.trim()) missing.push("address");
    if (!form.city.trim()) missing.push("city");
    if (regions && !form.state) missing.push("state");
    if (!form.zip.trim()) missing.push("zip");
    if (form.zip.trim() && !isValidPostalCode(form.country, form.zip)) {
      setError("Please enter a valid postal code for the selected country.");
      return;
    }
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(", ")}.`);
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

  const selectedRegions = regionsForCountry(form.country);

  // Auto-fill city & state from US / CA postal code via Zippopotam.us (free, no key).
  async function lookupZip(raw: string) {
    const zip = raw.trim();
    const cc = form.country;
    if (cc !== "US" && cc !== "CA") return;
    // US: 5 digits  |  CA: A1A 1A1
    const ok = cc === "US" ? /^\d{5}$/.test(zip) : /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/i.test(zip);
    if (!ok) { setZipFilled(false); return; }
    setZipLoading(true); setZipFilled(false);
    try {
      const res = await fetch(`https://api.zippopotam.us/${cc.toLowerCase()}/${encodeURIComponent(zip)}`);
      if (!res.ok) { setZipLoading(false); return; }
      const d = await res.json();
      const place = d.places?.[0];
      const city = place?.["place name"] ?? "";
      const state = place?.state ?? place?.["state abbreviation"] ?? "";
      if (!city && !state) { setZipLoading(false); return; }
      setForm((f) => ({ ...f, city: city, state: state }));
      setZipFilled(true);
    } catch { /* ignore — 3rd party down */ }
    finally { setZipLoading(false); }
  }

  // ---------- address autocomplete (Nominatim / OpenStreetMap – free, no key) ----------
  async function searchAddress(q: string) {
    if (q.trim().length < 3) { setAddrSuggestions([]); setAddrOpen(false); return; }
    setAddrLoading(true);
    try {
      const cc = form.country.toLowerCase();
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&countrycodes=${cc}&q=${encodeURIComponent(q)}`,
        { headers: { "User-Agent": "HanwooInternational/1.0" } });
      if (!res.ok) { setAddrSuggestions([]); return; }
      const data = await res.json();
      const items: AddressSuggestion[] = (data as any[]).map((p: any) => ({
        display: p.display_name?.split(",").slice(0,3).join(",") ?? "",
        address: (p.address?.road ?? p.address?.pedestrian ?? "") + (p.address?.house_number ? " " + p.address.house_number : ""),
        city: p.address?.city ?? p.address?.town ?? p.address?.village ?? "",
        state: p.address?.state ?? "",
        zip: p.address?.postcode ?? "",
      })).filter((a: AddressSuggestion) => a.display);
      setAddrSuggestions(items);
      setAddrOpen(items.length > 0);
    } catch { setAddrSuggestions([]); }
    finally { setAddrLoading(false); }
  }

  function selectAddress(a: AddressSuggestion) {
    setForm((f) => ({ ...f, address: a.address, city: a.city, state: a.state, zip: a.zip }));
    setAddrSuggestions([]);
    setAddrOpen(false);
    if (a.zip) { lookupZip(a.zip); } // confirm city/state match
  }

  // ---------- city suggestions by state (local data) ----------
  function loadCitiesForState(cc: string, st: string) {
    if (cc !== "US" || !st) { setCityOptions([]); setCityLoading(false); return; }
    const cities = getCitiesByState(st);
    setCityOptions(cities);
    setCityLoading(false);
  }

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("checkout.name")}</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-accent"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("checkout.email")}</label>
              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-accent"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("checkout.address")}</label>
            <div className="relative" ref={addrRef}>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-accent"
                placeholder={t("checkout.addressPlaceholder") ?? "Start typing your address…"}
                value={form.address}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm({ ...form, address: v });
                  if (addrTimer.current) clearTimeout(addrTimer.current);
                  addrTimer.current = setTimeout(() => searchAddress(v), 400);
                }}
                onFocus={() => { if (addrSuggestions.length > 0) setAddrOpen(true); }}
                autoComplete="off"
              />
              {addrLoading && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-accent">⏳</span>}
              {addrOpen && addrSuggestions.length > 0 && (
                <ul className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                  {addrSuggestions.map((a, i) => (
                    <li key={i}
                      className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-brand-accent/10"
                      onClick={() => selectAddress(a)}
                    >
                      {a.display}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("checkout.city")}
                {zipFilled && <span className="ml-1 text-xs text-green-600">(auto)</span>}
              </label>
              {cityOptions.length > 0 ? (
                <select
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-brand-accent ${zipFilled ? "border-green-300 bg-green-50" : "border-gray-300"}`}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                >
                  <option value="">Select city…</option>
                  {cityOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-brand-accent ${zipFilled ? "border-green-300 bg-green-50" : "border-gray-300"}`}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                  {cityLoading && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-accent">⏳</span>}
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("checkout.state")}
                {zipFilled && <span className="ml-1 text-xs text-green-600">(auto)</span>}
              </label>
              {selectedRegions ? (
                <select
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-brand-accent ${zipFilled ? "border-green-300 bg-green-50" : "border-gray-300"}`}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                >
                  <option value="">{t("checkout.stateSelect") ?? "Select…"}</option>
                  {selectedRegions.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-brand-accent ${zipFilled ? "border-green-300 bg-green-50" : "border-gray-300"}`}
                  placeholder={t("checkout.stateOther") ?? "State / Province"}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("checkout.country")}</label>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-accent"
              >
                {CHECKOUT_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("checkout.zip")}</label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-accent"
                  placeholder={form.country === "US" ? "10001 – auto-fill city & state" : form.country === "CA" ? "A1A 1A1" : form.country === "MX" ? "01000" : t("checkout.zipPlaceholder") ?? "Postal code"}
                  value={form.zip}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, zip: v });
                    lookupZip(v);
                  }}
                />
                {zipLoading && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-accent">⏳</span>}
                {zipFilled && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-600">✓ filled</span>}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("checkout.phone")} <span className="font-normal text-gray-400">({t("checkout.optional")})</span>
            </label>
            <input
              type="tel"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-accent"
              placeholder={t("checkout.phonePlaceholder") ?? "For delivery updates (optional)"}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

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
        <div className="mt-4 space-y-2 border-t pt-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{t("cart.subtotal")}</span>
            <span>{formatMoney(totalUSD, currency)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t("checkout.shipping")}</span>
            <span>{totalUSD >= SHIPPING_THRESHOLD ? (t("checkout.shippingFree") ?? "Free") : formatMoney(SHIPPING_FLAT_USD, currency)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-gray-900">
            <span>Total</span>
            <span>{formatMoney(totalUSD + (totalUSD >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_USD), currency)}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          {t("checkout.processedInUSD") ?? "Payments are processed in USD."}
        </p>
      </div>
    </div>
  );
}
