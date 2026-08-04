export type Localized = { en: string; zh: string };

export interface Product {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  /** Base price in USD; displayed in other currencies via conversion. */
  priceUSD: number;
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
  status: "pending" | "paid" | "failed";
  /** Which payment method the customer chose at checkout. */
  paymentMethod?: PaymentMethod;
  /** Zelle only: customer has told us they sent the transfer (awaiting our confirmation). */
  zelleConfirmed?: boolean;
  stripeSessionId?: string;
  createdAt: string;
}

export interface DBShape {
  version?: number;
  products: Product[];
  orders: Order[];
}
