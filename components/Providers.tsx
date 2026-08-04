"use client";

import { ReactNode } from "react";
import { I18nProvider } from "./I18nProvider";
import { CartProvider } from "./CartProvider";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <CartProvider>
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </CartProvider>
    </I18nProvider>
  );
}
