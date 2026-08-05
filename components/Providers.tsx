"use client";

import { ReactNode } from "react";
import { I18nProvider, useI18n } from "./I18nProvider";
import { CartProvider, useCart } from "./CartProvider";
import { Header } from "./Header";
import { Footer } from "./Footer";

/** Fixed bottom bar on mobile showing cart summary + checkout CTA. */
function MobileCartBar() {
  const { count, totalUSD } = useCart();
  const { t } = useI18n();
  if (count === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 py-3 md:hidden">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-gray-900">🛒 {count} {count === 1 ? (t("cart.item") ?? "item") : (t("cart.items") ?? "items")}</span>
          <span className="ml-2 text-sm text-gray-500">${totalUSD.toFixed(2)}</span>
        </div>
        <a href="/checkout" className="btn-primary px-6 py-2 text-sm">{t("mobile.checkout")}</a>
      </div>
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <CartProvider>
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
        <MobileCartBar />
      </CartProvider>
    </I18nProvider>
  );
}
