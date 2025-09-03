import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { productFiles } from "./buckets";
import { secret } from "encore.dev/config";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = secret("STRIPE_SECRET_KEY");

export interface CreateCheckoutSessionRequest {
  productId: number;
  successUrl: string; // should include placeholder for session_id or not, frontend will handle
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  // For paid items
  sessionId?: string;
  sessionUrl?: string;

  // For free items
  downloadUrl?: string;
}

// Creates a Stripe Checkout session for paid items, or returns a download URL for free items.
export const createCheckoutSession = api<CreateCheckoutSessionRequest, CreateCheckoutSessionResponse>(
  { expose: true, method: "POST", path: "/store/checkout/session" },
  async ({ productId, successUrl, cancelUrl }) => {
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

    if (!product) throw APIError.notFound("product not found");

    // Free product: return a fresh signed download URL right away
    if (product.priceCents === 0) {
      const { url } = await productFiles.signedDownloadUrl(product.fileKey, { ttl: 2 * 3600 });
      return { downloadUrl: url };
    }

    const sk = STRIPE_SECRET_KEY();
    if (!sk) {
      throw APIError.failedPrecondition("Stripe secret key not configured. Set STRIPE_SECRET_KEY in Infrastructure -> Secrets.");
    }
    if (!sk.startsWith("sk_")) {
      throw APIError.failedPrecondition("Invalid Stripe secret key configured. It must start with 'sk_'.");
    }

    const stripe = new Stripe(sk, { apiVersion: "2024-06-20" });

    // Generate a short-lived URL to include in metadata; we'll also generate fresh on retrieval
    const tempDownload = await productFiles.signedDownloadUrl(product.fileKey, { ttl: 2 * 3600 });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl.includes("session_id")
        ? successUrl
        : `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        product_id: String(product.id),
        download_url: tempDownload.url,
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
  }
);
