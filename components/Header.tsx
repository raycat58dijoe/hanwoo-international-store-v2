"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n, CURRENCIES } from "./I18nProvider";
import { useCart } from "./CartProvider";

export function Header() {
  const { t, locale, setLocale, currency, setCurrency } = useI18n();
  const { count } = useCart();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [allProducts, setAllProducts] = useState<{ slug: string; name: string; image: string }[]>([]);
  const [suggestions, setSuggestions] = useState<{ slug: string; name: string; image: string }[]>([]);
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Load product catalog for autocomplete
  useEffect(() => {
    if (!searchOpen || allProducts.length > 0) return;
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.products ?? []).map((p: any) => ({
          slug: p.slug,
          name: typeof p.name === "object" ? (p.name.en ?? "") : (p.name ?? ""),
          image: Array.isArray(p.images) ? p.images[0] : "",
        }));
        setAllProducts(list);
      })
      .catch(() => {});
  }, [searchOpen, allProducts.length]);

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const term = q.trim();
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
  };

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/products", label: t("nav.shop") },
    { href: "/products?category=featured", label: t("nav.featured") },
    { href: "/account", label: t("nav.account") },
  ];

  return (
    <>
      {/* Announcement bar */}
      <div className="announcement-bar">
        Free international shipping for orders above US$80 (not applicable for orders with power banks)
      </div>

      {/* Main navbar */}
      <header className="navbar sticky top-0 z-40">
        <div className="container-page flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            HANWOO
          </Link>

          {/* Navigation links (desktop) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
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

            {/* Search */}
            {searchOpen ? (
              <div className="relative" ref={searchRef}>
                <form onSubmit={submitSearch} className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={q}
                    onChange={(e) => {
                      const v = e.target.value;
                      setQ(v);
                      if (v.trim().length >= 2) {
                        const term = v.toLowerCase();
                        setSuggestions(allProducts.filter((p) => p.name.toLowerCase().includes(term)).slice(0, 6));
                      } else { setSuggestions([]); }
                    }}
                    placeholder={t("search.placeholder") ?? "Search products…"}
                    className="w-36 sm:w-52 rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-white outline-none placeholder:text-white/50"
                  />
                  <button type="submit" className="nav-icon-btn" title="Search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                    </svg>
                  </button>
                </form>
                {suggestions.length > 0 && (
                  <ul className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-white/10 bg-[#1a1a1a] shadow-xl overflow-hidden">
                    {suggestions.map((s) => (
                      <li key={s.slug} className="border-b border-white/5 last:border-0">
                        <button
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                          onClick={() => { setQ(""); setSuggestions([]); setSearchOpen(false); router.push(`/products/${s.slug}`); }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {s.image && <img src={s.image} alt="" className="h-8 w-8 rounded object-cover" />}
                          <span className="truncate">{s.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <button className="nav-icon-btn hidden sm:inline-flex" title="Search" onClick={() => setSearchOpen(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </button>
            )}

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

            {/* Mobile menu button */}
            <button
              className="nav-icon-btn md:hidden"
              aria-label="Menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileOpen ? (
                  <path d="M6 6l12 12M18 6L6 18"/>
                ) : (
                  <path d="M3 6h18M3 12h18M3 18h18"/>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-[var(--bg-dark)]">
            <div className="container-page flex flex-col gap-1 py-3">
              <form onSubmit={submitSearch} className="flex gap-2 pb-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("search.placeholder") ?? "Search products…"}
                  className="flex-1 rounded border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/50"
                />
                <button className="rounded bg-white/10 px-3 py-2 text-sm text-white">Go</button>
              </form>
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded px-2 py-2 text-sm text-[var(--fg-on-dark-muted)] hover:text-white hover:bg-white/5"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
