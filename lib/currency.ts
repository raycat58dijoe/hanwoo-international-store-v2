// Static demo exchange rates relative to USD. For production, fetch live rates
// from an FX API (e.g. exchangerate.host) on a schedule.
export const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.5,
  CNY: 7.24,
};

export const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
};

export const CURRENCY_LOCALE: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  CNY: "zh-CN",
};

export function convert(usd: number, currency: string): number {
  const rate = RATES[currency] ?? 1;
  return usd * rate;
}

export function formatMoney(usd: number, currency: string): string {
  const value = convert(usd, currency);
  const fractionDigits = currency === "JPY" ? 0 : 2;
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  } catch {
    return `${CURRENCY_SYMBOL[currency] ?? "$"}${value.toFixed(fractionDigits)}`;
  }
}
