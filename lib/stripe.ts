import Stripe from "stripe";

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export const isStripeConfigured = STRIPE_SECRET_KEY.startsWith("sk_");

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeConfigured) return null;
  if (!_stripe) _stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  return _stripe;
}
