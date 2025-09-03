import { api, APIError, Header } from "encore.dev/api";
import { newStripeClient, getStripeWebhookSecret } from "./stripe";

/**
 * Minimal Stripe webhook handler.
 * - Verifies webhook signature using STRIPE_WEBHOOK_SECRET when possible.
 * - Falls back to retrieving the event by ID from Stripe if signature verification fails due to raw body limitations.
 * - Never crashes silently; returns clear error responses.
 */

interface StripeWebhookParams {
  // Stripe sends the signature in this header.
  stripeSignature?: Header<"Stripe-Signature">;
  // Parsed JSON body from Stripe.
  // Note: Encore parses JSON bodies; we do not have access to the raw body string here.
  // This prevents exact signature verification in some frameworks. We handle a graceful fallback.
  id?: string;
  type?: string;
  data?: any;
}

interface StripeWebhookResponse {
  received: boolean;
}

// Handles Stripe webhook events.
export const stripeWebhook = api<StripeWebhookParams, StripeWebhookResponse>(
  { expose: true, method: "POST", path: "/store/stripe/webhook" },
  async (req) => {
    const secret = getStripeWebhookSecret();
    if (!secret) {
      // Webhooks are optional; if not configured, return a clear error.
      throw APIError.failedPrecondition(
        "Stripe webhook secret not configured. Set STRIPE_WEBHOOK_SECRET to handle webhooks."
      );
    }

    // Attempt to verify the signature using the parsed payload as a JSON string.
    // Warning: This may fail since Stripe requires the exact raw request body.
    const stripe = newStripeClient();
    let event: any | null = null;

    try {
      if (!req.stripeSignature) {
        throw new Error("Missing Stripe-Signature header");
      }
      // Best-effort: construct event using JSON stringified body.
      // This can fail due to raw body differences; we catch and fallback below.
      const payload = JSON.stringify(req);
      event = stripe.webhooks.constructEvent(payload, req.stripeSignature, secret);
    } catch (sigErr: any) {
      // Fallback: verify event by retrieving it via the Stripe API using the event ID.
      // This ensures we only process real events sent by Stripe.
      if (!req.id) {
        console.error("Stripe webhook signature verification failed and no event id present:", sigErr);
        throw APIError.invalidArgument("Invalid webhook payload: missing event id");
      }
      try {
        event = await stripe.events.retrieve(req.id);
      } catch (retrieveErr: any) {
        console.error("Failed to retrieve Stripe event:", retrieveErr);
        throw APIError.unauthenticated("Stripe webhook verification failed");
      }
    }

    // Process only the events we care about.
    switch (event.type) {
      case "checkout.session.completed": {
        // In this app, clients retrieve the download URL via /store/checkout/session/:id.
        // You could optionally mark a purchase as completed here if you track purchases.
        // const session = event.data.object;
        break;
      }
      default:
        // No-op for other events; add cases as needed.
        break;
    }

    return { received: true };
  }
);
