"use client";

import Link from "next/link";
import { useI18n, CURRENCIES } from "./I18nProvider";
import { useCart } from "./CartProvider";

export function Header() {
  const { t, locale, setLocale, currency, setCurrency } = useI18n();
  const { count } = useCart();

  return (
    <>
      {/* Announcement bar */}
      <div className="announcement-bar">
        Click here for international updates &nbsp;|&nbsp; Free international shipping for orders above US$80 (not applicable for orders with power banks)
      </div>

      {/* Main navbar */}
      <header className="navbar sticky top-0 z-40">
        <div className="container-page flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            HANWOO
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link href="/">{t("nav.home")}</Link>
            <Link href="/products">{t("nav.shop")}</Link>
            <Link href="/products?category=featured">{t("nav.featured")}</Link>
            <Link href="/products?category=device">{t("nav.device")}</Link>
            <Link href="/products">{t("nav.collection")}</Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Currency selector */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as typeof currency)}
              className="bg-transparent text-xs font-semibold text-[var(--fg-on-dark-muted)] border border-white/10 rounded px-1.5 py-1 cursor-pointer outline-none"
              aria-label="Currency"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="text-gray-900">
                  {c}
                </option>
              ))}
            </select>

            {/* Language toggle */}
            <button
              onClick={() => setLocale(locale === "en" ? "zh" : "en")}
              className="bg-transparent text-xs font-semibold text-[var(--fg-on-dark-muted)] border border-white/10 rounded px-1.5 py-1 cursor-pointer hover:border-[var(--accent)] transition-colors"
              title={t("lang.toggle")}
            >
              {locale === "en" ? "EN" : "中"}
            </button>

            {/* Search icon */}
            <span className="nav-icon-btn" title="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </span>

            {/* Cart */}
            <Link href="/cart" className="nav-icon-btn relative" title={t("nav.cart")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-[var(--bg-darker)]">
                  {count}
                </span>
              )}
            </Link>

            {/* User / Admin */}
            <Link href="/admin" className="nav-icon-btn hidden sm:inline-flex" title={t("nav.admin")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>

            {/* Mobile menu button */}
            <button className="nav-icon-btn md:hidden" id="mobile-menu-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
