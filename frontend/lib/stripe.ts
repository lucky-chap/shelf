import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns true if a publishable key is configured and looks valid.
 * Reads directly from Vite's import.meta.env.
 */
export function isStripeConfigured(): boolean {
  const key = import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  return typeof key === "string" && key.trim().length > 0 && key.startsWith("pk_");
}

/**
 * Loads Stripe.js using the configured publishable key from import.meta.env.
 * Throws a descriptive error if the key is missing or invalid.
 */
export function getStripe(): Promise<Stripe | null> {
  const key = import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  if (!key || !key.startsWith("pk_")) {
    throw new Error(
      "Missing or invalid VITE_STRIPE_PUBLISHABLE_KEY. Please set it in your .env file (must start with 'pk_')."
    );
  }
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
