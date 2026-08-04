export type Localized = { en: string; zh: string };

export interface Product {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  /** Base price in USD; displayed in other currencies via conversion. */
  priceUSD: number;
  /** Optional sale price in USD. When set, it is displayed (and charged) instead of priceUSD, which is shown struck-through. */
  salePriceUSD?: number;
  images: string[];
  category: string;
  inventory: number;
  featured: boolean;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  name: Localized;
  image: string;
  priceUSD: number;
  qty: number;
}

export type PaymentMethod = "stripe" | "zelle";

/**
 * Order lifecycle:
 *  pending  → awaiting payment (or Zelle transfer not yet confirmed)
 *  paid     → payment received, ready to fulfill
 *  shipped  → handed to carrier, tracking number attached
 *  delivered→ marked delivered by admin
 *  failed   → payment failed / declined
 */
export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "failed";

export interface Order {
  id: string;
  items: OrderItem[];
  amountUSD: number;
  currency: string;
  customer: {
    name: string;
    email: string;
    address: string;
    city: string;
    country: string;
    zip: string;
  };
  status: OrderStatus;
  /** Which payment method the customer chose at checkout. */
  paymentMethod?: PaymentMethod;
  /** Zelle only: customer has told us they sent the transfer (awaiting our confirmation). */
  zelleConfirmed?: boolean;
  stripeSessionId?: string;
  createdAt: string;
  /** Fulfillment: carrier tracking number set when marked shipped. */
  trackingNumber?: string;
  /** Optional tracking URL (e.g. carrier lookup page). */
  trackingUrl?: string;
  /** ISO timestamp when the order was handed to the carrier. */
  shippedAt?: string;
  /** Internal admin note (not shown to customer). */
  note?: string;
}

export interface DBShape {
  version?: number;
  products: Product[];
  orders: Order[];
}
