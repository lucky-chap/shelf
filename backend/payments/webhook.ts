import { api, APIError } from "encore.dev/api";
import { paymentsDB } from "./db";
import { secret } from "encore.dev/config";
import { Header } from "encore.dev/api";
import Stripe from "stripe";
import crypto from "crypto";

const stripeSecretKey = secret("StripeSecretKey");
const stripeWebhookSecret = secret("StripeWebhookSecret");

export interface WebhookRequest {
  stripeSignature: Header<"Stripe-Signature">;
}

export interface WebhookResponse {
  received: boolean;
}

// Handles Stripe webhook events for payment processing.
export const webhook = api<WebhookRequest, WebhookResponse>(
  { expose: true, method: "POST", path: "/payments/webhook" },
  async (req, { rawBody }) => {
    const sig = req.stripeSignature;
    if (!sig) {
      throw APIError.invalidArgument("missing stripe signature");
    }

    let event: Stripe.Event;

    try {
      // Initialize Stripe client with the secret key
      const stripe = new Stripe(stripeSecretKey(), {
        apiVersion: "2024-12-18.acacia",
      });

      // Verify webhook signature using rawBody
      event = stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret());
    } catch (error: any) {
      console.error("Webhook signature verification failed:", error.message);
      throw APIError.invalidArgument("invalid signature");
    }

    // Handle payment_intent.succeeded event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      try {
        await handleSuccessfulPayment(paymentIntent);
      } catch (error: any) {
        console.error("Failed to handle successful payment:", error);
        throw APIError.internal("failed to process payment");
      }
    }

    return { received: true };
  }
);

async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata;
  const productId = parseInt(metadata.productId);
  const buyerEmail = metadata.buyerEmail;
  const buyerName = metadata.buyerName || null;
  const downloadUrl = metadata.downloadUrl;

  if (!productId || !buyerEmail || !downloadUrl) {
    throw new Error("Missing required metadata in payment intent");
  }

  // Check if purchase already exists
  const existingPurchase = await paymentsDB.queryRow<{ id: number }>`
    SELECT id FROM purchases WHERE payment_id = ${paymentIntent.id}
  `;

  if (existingPurchase) {
    console.log(`Purchase already exists for payment intent ${paymentIntent.id}`);
    return;
  }

  // Generate a secure download token
  const downloadToken = crypto.randomBytes(32).toString('hex');
  
  // Downloads expire in 30 days for purchased items
  const downloadExpiresAt = new Date();
  downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 30);

  // Create purchase record
  const purchase = await paymentsDB.queryRow<{
    id: number;
    productId: number;
  }>`
    INSERT INTO purchases (
      product_id, 
      buyer_email, 
      buyer_name, 
      amount_paid_cents, 
      payment_provider, 
      payment_id, 
      download_token, 
      download_expires_at,
      download_url
    )
    VALUES (
      ${productId}, 
      ${buyerEmail}, 
      ${buyerName}, 
      ${paymentIntent.amount}, 
      'stripe', 
      ${paymentIntent.id}, 
      ${downloadToken}, 
      ${downloadExpiresAt},
      ${downloadUrl}
    )
    RETURNING id, product_id as "productId"
  `;

  if (!purchase) {
    throw new Error("Failed to create purchase record");
  }

  // Update product purchase count
  await paymentsDB.exec`
    UPDATE products 
    SET purchase_count = purchase_count + 1, updated_at = NOW()
    WHERE id = ${productId}
  `;

  console.log(`Successfully processed purchase ${purchase.id} for product ${productId}`);
}
