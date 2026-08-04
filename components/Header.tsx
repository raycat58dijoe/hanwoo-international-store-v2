"use client";

import Link from "next/link";
import { useI18n, CURRENCIES } from "./I18nProvider";
import { useCart } from "./CartProvider";

export function Header() {
  const { t, locale, setLocale, currency, setCurrency } = useI18n();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-gray-900">
            Hanwoo International
          </span>
          <span className="hidden text-xs text-gray-400 sm:inline">
            {t("brand.tagline")}
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4">
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-brand-accent">
            {t("nav.home")}
          </Link>
          <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-brand-accent">
            {t("nav.shop")}
          </Link>
          <Link href="/cart" className="relative text-sm font-medium text-gray-700 hover:text-brand-accent">
            {t("nav.cart")}
            {count > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-brand-accent">
            {t("nav.admin")}
          </Link>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as typeof currency)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            aria-label="Currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={() => setLocale(locale === "en" ? "zh" : "en")}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            {t("lang.toggle")}
          </button>
        </nav>
      </div>
    </header>
  );
}
