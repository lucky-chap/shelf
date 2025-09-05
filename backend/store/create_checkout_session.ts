import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";

import { stripeSecretKey } from "./config"

/**
 * Reads a non-empty environment variable.
 */
function readEnv(name: string): string | null {
  // const v = process.env[name];
  // if (v && typeof v === "string" && v.trim().length > 0) {
  //   return v;
  // }
  // return null;
	return "sk_test_51S2Y3iPUkb8apElmlzd3CE3r0ReJ2KjC9sDyYXiIps1onwmA6sff6JX4OzFR7N8n9Ub3zRL12tNKGq9OTxmgdlI500vRtyRqQV"
}

export interface CreateCheckoutSessionRequest {
  productId: number;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

// Creates a Stripe checkout session for a product.
export const createCheckoutSession = api<CreateCheckoutSessionRequest, CreateCheckoutSessionResponse>(
  { expose: true, method: "POST", path: "/store/checkout" },
  async (req) => {
    if (!stripeSecretKey()) {
      throw APIError.failedPrecondition("Stripe not configured (STRIPE_SECRET_KEY missing)");
    }

    // Get product details
    const product = await storeDB.queryRow<{
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
      throw APIError.failedPrecondition("product is not available");
    }

    if (product.priceCents === 0) {
      throw APIError.invalidArgument("free products do not require checkout");
    }

    try {
      // Import Stripe dynamically
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeSecretKey(), {
        apiVersion: "2023-10-16"
      });

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: product.title,
                description: `Digital download: ${product.title}`
              },
              unit_amount: product.priceCents
            },
            quantity: 1
          }
        ],
        customer_email: req.customerEmail,
        success_url: req.successUrl,
        cancel_url: req.cancelUrl,
        metadata: {
          productId: product.id.toString()
        },
        allow_promotion_codes: true
      });

      if (!session.id || !session.url) {
        throw APIError.internal("failed to create checkout session");
      }

      return {
        sessionId: session.id,
        url: session.url
      };
    } catch (error: any) {
      console.error("Stripe checkout session creation failed:", error);
      if (error.code) {
        throw error; // Re-throw APIErrors
      }
      throw APIError.internal("failed to create checkout session");
    }
  }
);
