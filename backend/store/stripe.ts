import { secret } from "encore.dev/config";
import Stripe from "stripe";

const stripeSecretKey = secret("stripe_secret_key");

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = stripeSecretKey();
    stripe = new Stripe(key, {
      apiVersion: "2024-06-20",
    });
  }
  return stripe!;
}
