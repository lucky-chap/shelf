import { loadStripe, Stripe } from "@stripe/stripe-js";
import { STRIPE_PUBLISHABLE_KEY } from "../config";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns true if a publishable key is configured and looks valid.
 */
export function isStripeConfigured(): boolean {
  return typeof STRIPE_PUBLISHABLE_KEY === "string" && 
         STRIPE_PUBLISHABLE_KEY.trim().length > 0 && 
         STRIPE_PUBLISHABLE_KEY.startsWith('pk_');
}

/**
 * Loads Stripe.js using the configured publishable key.
 * Throws a descriptive error if the key is missing or invalid.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe publishable key is missing or invalid. Set VITE_STRIPE_PUBLISHABLE_KEY in your environment with a value starting with 'pk_'.");
  }
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}
