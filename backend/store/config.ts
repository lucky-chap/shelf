import { secret } from "encore.dev/config";

export const stripeSecretKey = secret("STRIPE_SECRET_KEY");
export const stripeWebhookSecret = secret("STRIPE_WEBHOOK_SECRET");
