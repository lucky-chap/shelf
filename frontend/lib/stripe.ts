import { loadStripe, Stripe } from "@stripe/stripe-js";
import { stripePublishableKey } from "../config";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns true if a publishable key is configured and looks valid.
 */
export function isStripeConfigured(): boolean {
  return typeof stripePublishableKey === "string" && /^pk_/.test(stripePublishableKey);
}

/**
 * Loads Stripe.js using the configured publishable key.
 * Throws a descriptive error if the key is missing or invalid.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe publishable key is missing or invalid. Set it in frontend/config.ts with a value starting with 'pk_'.");
  }
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
}
