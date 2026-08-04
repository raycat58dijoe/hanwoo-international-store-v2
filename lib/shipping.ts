// Shipping rules (USD).
// Free international shipping on orders over SHIPPING_THRESHOLD,
// otherwise a flat rate is charged. Power banks may be excluded (announced
// in the store header) — that exclusion is handled manually at fulfillment.

export const SHIPPING_THRESHOLD = 80;
export const SHIPPING_FLAT_USD = 9.99;

export function calcShippingUSD(subtotalUSD: number): number {
  if (subtotalUSD >= SHIPPING_THRESHOLD) return 0;
  return SHIPPING_FLAT_USD;
}
