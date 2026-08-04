"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { STRINGS, StringKey, Locale } from "@/lib/i18n";

export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY"] as const;
export type Currency = (typeof CURRENCIES)[number];

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: StringKey) => string;
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved === "en" || saved === "zh") setLocaleState(saved);
    const cur = localStorage.getItem("currency") as Currency | null;
    if (cur && CURRENCIES.includes(cur)) setCurrencyState(cur);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  };

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
  };

  const t = useCallback(
    (k: StringKey) => STRINGS[locale][k] ?? STRINGS.en[k] ?? k,
    [locale]
  );

  return (
    <Ctx.Provider value={{ locale, setLocale, t, currency, setCurrency }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
