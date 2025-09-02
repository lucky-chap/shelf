import { api, APIError } from "encore.dev/api";
import { paymentsDB } from "./db";
import { secret } from "encore.dev/config";
import Stripe from "stripe";

const stripeSecretKey = secret("StripeSecretKey");

export interface CreatePaymentIntentRequest {
  productId: number;
  buyerEmail: string;
  buyerName?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  productTitle: string;
}

// Creates a Stripe payment intent for a product purchase.
export const createIntent = api<CreatePaymentIntentRequest, CreatePaymentIntentResponse>(
  { expose: true, method: "POST", path: "/payments/create-intent" },
  async (req) => {
    // Get product details
    const product = await paymentsDB.queryRow<{
      id: number;
      title: string;
      priceCents: number;
      isActive: boolean;
    }>`
      SELECT id, title, price_cents as "priceCents", is_active as "isActive"
      FROM products 
      WHERE id = ${req.productId}
    `;

    if (!product) {
      throw APIError.notFound("product not found");
    }

    if (!product.isActive) {
      throw APIError.failedPrecondition("product is not available for purchase");
    }

    const amountCents = product.priceCents;

    if (amountCents < 50) { // Stripe minimum is $0.50
      throw APIError.invalidArgument("amount must be at least $0.50");
    }

    try {
      // Initialize Stripe client with the secret key
      const stripe = new Stripe(stripeSecretKey(), {
        apiVersion: "2024-12-18.acacia",
      });

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        receipt_email: req.buyerEmail,
        metadata: {
          productId: req.productId.toString(),
          buyerEmail: req.buyerEmail,
          buyerName: req.buyerName || "",
        },
        description: `Purchase: ${product.title}`,
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amount: amountCents,
        productTitle: product.title,
      };
    } catch (error: any) {
      console.error("Failed to create Stripe payment intent:", error);
      throw APIError.internal("failed to create payment intent");
    }
  }
);
