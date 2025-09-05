import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { Header } from "encore.dev/api";

import { stripeSecretKey, stripeWebhookSecret } from "./config"

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
    const webhookSecret = stripeWebhookSecret();
    const secretKey = stripeSecretKey();

    if (!webhookSecret) {
      throw APIError.failedPrecondition("Stripe webhook secret not configured");
    }

    if (!secretKey) {
      throw APIError.failedPrecondition("Stripe secret key not configured");
    }

    if (!req.stripeSignature) {
      throw APIError.invalidArgument("missing Stripe signature");
    }

    try {
      // Import Stripe dynamically
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secretKey, {
        apiVersion: "2023-10-16"
      });

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        req.body,
        req.stripeSignature,
        webhookSecret
      );

      console.log("Processing Stripe webhook event:", event.type, "ID:", event.id);

      // Handle the checkout session completed event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        
        console.log("Processing checkout session:", session.id);
        console.log("Session metadata:", session.metadata);
        console.log("Session customer details:", session.customer_details);
        console.log("Session amount total:", session.amount_total);
        console.log("Session payment intent:", session.payment_intent);
        
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

        console.log("Recording purchase for session:", session.id, "product:", productId, "title:", product.title);

        // Check if purchase already exists to avoid duplicates
        const existingPurchase = await storeDB.queryRow<{ id: number }>`
          SELECT id FROM purchases 
          WHERE stripe_session_id = ${session.id} AND product_id = ${productId}
        `;

        if (existingPurchase) {
          console.log("Purchase already exists for session:", session.id);
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
            purchase_date,
            download_count,
            last_downloaded_at
          ) VALUES (
            ${productId},
            ${session.id},
            ${session.payment_intent || null},
            ${session.customer_details?.email || session.customer_email || null},
            ${session.amount_total || product.priceCents},
            NOW(),
            0,
            NULL
          )
        `;

        console.log("Purchase recorded successfully for session:", session.id, "product:", productId);

        // Verify the purchase was created
        const verifyPurchase = await storeDB.queryRow<{ id: number; productId: number }>`
          SELECT id, product_id as "productId"
          FROM purchases 
          WHERE stripe_session_id = ${session.id} AND product_id = ${productId}
        `;

        if (verifyPurchase) {
          console.log("Purchase verification successful:", verifyPurchase);
        } else {
          console.error("Purchase verification failed for session:", session.id);
        }
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
