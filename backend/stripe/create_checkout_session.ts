import { api, APIError } from "encore.dev/api";
import { productsDB } from "../products/db";

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

/**
 * Optional Encore secret fallback.
 */
function readEncoreSecret(name: "STRIPE_SECRET_KEY"): string | null {
  try {
    const { secret } = require("encore.dev/config") as typeof import("encore.dev/config");
    const s = secret(name);
    const val = s();
    return val && val.trim().length > 0 ? val : null;
  } catch {
    return null;
  }
}

export interface CreateCheckoutSessionRequest {
  productId: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

// Creates a Stripe checkout session for a product purchase.
export const createCheckoutSession = api<CreateCheckoutSessionRequest, CreateCheckoutSessionResponse>(
  { expose: true, method: "POST", path: "/stripe/create-checkout-session" },
  async (req) => {
    const stripeSecretKey = readEnv("STRIPE_SECRET_KEY") || readEncoreSecret("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw APIError.failedPrecondition("Stripe secret key not configured (STRIPE_SECRET_KEY)");
    }

    // Get product details
    const product = await productsDB.queryRow<{
      id: number;
      title: string;
      description: string;
      priceCents: number;
      downloadUrl: string;
    }>`
      SELECT id, title, description, price_cents as "priceCents", download_url as "downloadUrl"
      FROM products 
      WHERE id = ${req.productId} AND is_active = true
    `;

    if (!product) {
      throw APIError.notFound("product not found");
    }

    if (product.priceCents <= 0) {
      throw APIError.invalidArgument("cannot create checkout session for free products");
    }

    try {
      // Import Stripe dynamically
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2023-10-16",
      });

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: product.title,
                description: product.description,
              },
              unit_amount: product.priceCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: req.successUrl + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: req.cancelUrl,
        metadata: {
          productId: product.id.toString(),
          downloadUrl: product.downloadUrl,
        },
      });

      if (!session.id || !session.url) {
        throw APIError.internal("failed to create checkout session");
      }

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error: any) {
      if (error.code) {
        throw error; // Re-throw APIErrors
      }
      console.error("Stripe checkout session creation failed:", error);
      throw APIError.internal("failed to create checkout session");
    }
  }
);
