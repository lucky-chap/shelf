import { api, APIError, Header } from "encore.dev/api";
import { getStripe } from "./stripe";

// Note: Stripe recommends validating the webhook signature against the raw request body.
// Encore.ts automatically parses JSON request bodies. As a pragmatic approach, we retrieve
// the event by ID from Stripe which ensures authenticity, then handle it.

export interface StripeWebhookRequest {
  id: string; // event id
  type: string;
  data: any;
  livemode: boolean;
  request?: { id: string | null; idempotency_key: string | null } | null;
  // we still read sig header
  stripeSignature?: Header<"Stripe-Signature">;
}

// Handles Stripe webhooks for checkout.session.completed.
export const stripeWebhook = api<StripeWebhookRequest, void>(
  { expose: true, method: "POST", path: "/store/stripe/webhook" },
  async (req) => {
    const stripe = getStripe();

    if (!req.id) {
      throw APIError.invalidArgument("missing event id");
    }

    // Retrieve event from Stripe to verify authenticity
    const event = await stripe.events.retrieve(req.id);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      // You could record fulfillment here if desired.
      // Since downloads are generated just-in-time from session verification,
      // no additional action is required here.
    }

    // No-op for other events
  }
);
