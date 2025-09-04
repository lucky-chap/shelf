import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { Header } from "encore.dev/api";

/**
 * Reads a non-empty environment variable.
 */
function readEnv(name: string): string | null {
  const v = process.env[name];
  if (v && typeof v === "string" && v.trim().length > 0) {
    return v;
  }
  return null;
}

export interface StripeWebhookRequest {
  stripeSignature: Header<"Stripe-Signature">;
  body: string; // Raw webhook body
}

export interface StripeWebhookResponse {
  received: boolean;
}

// Handles Stripe webhook events.
export const stripeWebhook = api<StripeWebhookRequest, StripeWebhookResponse>(
  { expose: true, method: "POST", path: "/store/webhook" },
  async (req) => {
    const stripeSecretKey = readEnv("STRIPE_SECRET_KEY");
    const webhookSecret = readEnv("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      throw APIError.failedPrecondition("Stripe webhook secret not configured");
    }

		if (!stripeSecretKey) {
      throw APIError.failedPrecondition("Stripe secret key not configured");
    }

    if (!req.stripeSignature) {
      throw APIError.invalidArgument("missing Stripe signature");
    }

    try {
      // Import Stripe dynamically
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2023-10-16"
      });

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        req.body,
        req.stripeSignature,
        webhookSecret
      );

      // Handle the checkout session completed event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        
        // Extract product ID from metadata
        const productId = parseInt(session.metadata?.productId);
        if (!productId) {
          console.error("No product ID in session metadata:", session.id);
          return { received: true };
        }

        // Get product details
        const product = await storeDB.queryRow<{ title: string; priceCents: number }>`
          SELECT title, price_cents as "priceCents"
          FROM products 
          WHERE id = ${productId}
        `;

        if (!product) {
          console.error("Product not found for session:", session.id, "productId:", productId);
          return { received: true };
        }

        // Record the purchase
        await storeDB.exec`
          INSERT INTO purchases (
            product_id,
            stripe_session_id,
            stripe_payment_intent_id,
            customer_email,
            amount_paid_cents,
            purchase_date
          ) VALUES (
            ${productId},
            ${session.id},
            ${session.payment_intent || null},
            ${session.customer_details?.email || session.customer_email || null},
            ${session.amount_total || product.priceCents},
            NOW()
          )
          ON CONFLICT (stripe_session_id) DO NOTHING
        `;

        console.log("Purchase recorded for session:", session.id, "product:", productId);
      }

      return { received: true };
    } catch (error: any) {
      console.error("Stripe webhook error:", error);
      if (error.type === "StripeSignatureVerificationError") {
        throw APIError.unauthenticated("invalid signature");
      }
      throw APIError.internal("webhook processing failed");
    }
  }
);
