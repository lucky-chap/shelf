import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { productFiles } from "./buckets";
import { secret } from "encore.dev/config";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = secret("STRIPE_SECRET_KEY");

export interface CreateCheckoutSessionRequest {
  productId: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId?: string;
  sessionUrl?: string;
  downloadUrl?: string;
}

// Creates a Stripe Checkout session for paid items, or returns a download URL for free items.
export const createCheckoutSession = api<CreateCheckoutSessionRequest, CreateCheckoutSessionResponse>(
  { expose: true, method: "POST", path: "/store/checkout/session" },
  async ({ productId, successUrl, cancelUrl }) => {
    try {
      const product = await storeDB.queryRow<{
        id: number;
        title: string;
        description: string | null;
        priceCents: number;
        coverUrl: string | null;
        fileKey: string;
      }>`
        SELECT
          id,
          title,
          description,
          price_cents as "priceCents",
          cover_url as "coverUrl",
          file_key as "fileKey"
        FROM products
        WHERE id = ${productId} AND is_active = true
      `;

      if (!product) {
        throw APIError.notFound("product not found");
      }

      // Free product: return a fresh signed download URL right away
      if (product.priceCents === 0) {
        try {
          const { url } = await productFiles.signedDownloadUrl(product.fileKey, { ttl: 2 * 3600 });
          return { downloadUrl: url };
        } catch (error: any) {
          console.error("Failed to generate download URL:", error);
          throw APIError.internal("Failed to generate download URL for free product");
        }
      }

      // For paid products, check if Stripe is configured
      const sk = STRIPE_SECRET_KEY();
      if (!sk) {
        throw APIError.failedPrecondition("Stripe secret key not configured. Set STRIPE_SECRET_KEY in Infrastructure -> Secrets.");
      }
      if (!sk.startsWith("sk_")) {
        throw APIError.failedPrecondition("Invalid Stripe secret key configured. It must start with 'sk_'.");
      }

      const stripe = new Stripe(sk, { apiVersion: "2024-06-20" });

      // Generate a short-lived URL to include in metadata
      let tempDownloadUrl = "";
      try {
        const tempDownload = await productFiles.signedDownloadUrl(product.fileKey, { ttl: 2 * 3600 });
        tempDownloadUrl = tempDownload.url;
      } catch (error: any) {
        console.error("Failed to generate temp download URL:", error);
        throw APIError.internal("Failed to generate download URL");
      }

      try {
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          success_url: successUrl.includes("session_id")
            ? successUrl
            : `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl,
          metadata: {
            product_id: String(product.id),
            download_url: tempDownloadUrl,
            file_key: product.fileKey,
          },
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: product.priceCents,
                product_data: {
                  name: product.title,
                  description: product.description || undefined,
                  images: product.coverUrl ? [product.coverUrl] : undefined,
                },
              },
            },
          ],
        });

        return { sessionId: session.id, sessionUrl: session.url ?? undefined };
      } catch (stripeError: any) {
        console.error("Stripe session creation failed:", stripeError);
        throw APIError.internal(`Failed to create Stripe session: ${stripeError.message}`);
      }
    } catch (error: any) {
      console.error("Create checkout session error:", error);
      
      // Re-throw APIErrors as-is
      if (error.code) {
        throw error;
      }
      
      // Wrap other errors
      throw APIError.internal(`Checkout session creation failed: ${error.message}`);
    }
  }
);
