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
  /** Optional merchant SKU / item number. */
  sku?: string;
  /** Optional tags used for filtering/merchandising. */
  tags?: string[];
  /** ISO timestamp of the last update (auto-managed). */
  updatedAt?: string;
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

export interface Review {
  id: string;
  productId: string;
  orderId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
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
  /** Account id when placed by a signed-in user; undefined for guest checkout. */
  userId?: string;
  customer: {
    name: string;
    email: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    zip: string;
    phone?: string;
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
  /** Shipping fee in USD (0 = free shipping). */
  shippingUSD?: number;
  /** After-sales / return request (customer-facing). */
  returnRequested?: boolean;
  returnReason?: string;
  returnStatus?: "none" | "requested" | "approved" | "rejected" | "refunded";
  /** Internal admin note (not shown to customer). */
  note?: string;
}

export interface DBShape {
  version?: number;
  products: Product[];
  orders: Order[];
}
