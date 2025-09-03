import { APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = secret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = secret("STRIPE_WEBHOOK_SECRET");

/**
 * Returns the configured Stripe secret key or throws a descriptive API error.
 * Ensures the key starts with 'sk_'.
 */
export function getStripeSecretKey(): string {
  const sk = STRIPE_SECRET_KEY();
  if (!sk) {
    throw APIError.failedPrecondition("Stripe secret key not configured. Set STRIPE_SECRET_KEY in Infrastructure -> Secrets.");
  }
  if (!sk.startsWith("sk_")) {
    throw APIError.failedPrecondition("Invalid Stripe secret key configured. It must start with 'sk_'.");
  }
  return sk;
}

/**
 * Returns the configured Stripe webhook secret.
 * If set, ensures it looks like a Stripe webhook secret ('whsec_...').
 * It's optional unless you configure webhooks.
 */
export function getStripeWebhookSecret(): string | null {
  const wh = STRIPE_WEBHOOK_SECRET();
  if (!wh) return null;
  if (!wh.startsWith("whsec_")) {
    throw APIError.failedPrecondition("Invalid Stripe webhook secret. It must start with 'whsec_'.");
  }
  return wh;
}

/**
 * Creates a new Stripe client using the validated secret key.
 */
export function newStripeClient(): Stripe {
  const sk = getStripeSecretKey();
  return new Stripe(sk, { apiVersion: "2024-06-20" });
}
