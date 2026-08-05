"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import Link from "next/link";
import { useI18n } from "./I18nProvider";
import type { Localized } from "@/lib/types";

export interface CartItem {
  productId: string;
  slug: string;
  name: Localized;
  image: string;
  priceUSD: number;
  qty: number;
}

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
  totalUSD: number;
  /** Toast state for the add-to-cart mini confirmation */
  toast: CartItem | null;
  dismissToast: () => void;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<CartItem | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("cart");
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const add: CartCtx["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === item.productId);
      if (found) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...item, qty }];
    });
    // Show toast confirmation — auto-dismiss after 6s
    const toastItem: CartItem = { ...item, qty };
    setToast(toastItem);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };

  const dismissToast = useCallback(() => {
    setToast(null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const remove: CartCtx["remove"] = (productId) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const setQty: CartCtx["setQty"] = (productId, qty) =>
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, qty: Math.max(0, qty) } : i))
        .filter((i) => i.qty > 0)
    );

  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const totalUSD = useMemo(
    () => items.reduce((s, i) => s + i.priceUSD * i.qty, 0),
    [items]
  );

  return (
    <Ctx.Provider value={{ items, add, remove, setQty, clear, count, totalUSD, toast, dismissToast }}>
      {children}
      <CartToast />
    </Ctx.Provider>
  );
}

/** Mini confirmation popup shown after adding an item to cart. */
function CartToast() {
  const { toast, dismissToast, count, totalUSD } = useCart();
  const { t } = useI18n();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[380px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl animate-slide-up">
      <div className="flex items-start gap-3">
        <span className="text-xl">🛒</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{t("toast.added")}</p>
          <p className="mt-0.5 text-xs text-gray-500 truncate">{toast.name.en}</p>
          <p className="mt-1 text-xs text-gray-400">{count} {count === 1 ? (t("cart.item") ?? "item") : (t("cart.items") ?? "items")} · ${totalUSD.toFixed(2)}</p>
          <div className="mt-3 flex gap-2">
            <button onClick={dismissToast} className="btn-secondary px-4 py-1.5 text-xs">{t("toast.continue")}</button>
            <a href="/cart" className="btn-primary px-4 py-1.5 text-xs">{t("toast.viewCart")}</a>
          </div>
        </div>
        <button onClick={dismissToast} className="text-gray-300 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>
    </div>
  );
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
