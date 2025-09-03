import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { getStripe } from "./stripe";
import { productFilesBucket } from "./storage";

export interface CreateCheckoutSessionRequest {
  productId: number;
  successUrl: string; // frontend URL to redirect after success (Stripe will append session_id)
  cancelUrl: string;  // frontend URL if user cancels
}

export interface CreateCheckoutSessionResponse {
  // For paid items:
  sessionId?: string;

  // For free items:
  freeDownloadUrl?: string; // short-lived signed download URL
}

// Creates a Stripe Checkout Session for paid products,
// or returns a direct signed download URL for free products.
export const createCheckoutSession = api<CreateCheckoutSessionRequest, CreateCheckoutSessionResponse>(
  { expose: true, method: "POST", path: "/store/checkout/session" },
  async ({ productId, successUrl, cancelUrl }) => {
    const product = await storeDB.queryRow<{
      id: number;
      title: string;
      description: string | null;
      priceCents: number;
      currency: string;
      fileObjectName: string;
      active: boolean;
    }>`
      SELECT
        id, title, description, price_cents as "priceCents", currency,
        file_object_name as "fileObjectName", active
      FROM products
      WHERE id = ${productId}
    `;

    if (!product || !product.active) {
      throw APIError.notFound("product not found");
    }

    // Free product: bypass Stripe and return a short-lived download url
    if (product.priceCents === 0) {
      const signed = await productFilesBucket.signedDownloadUrl(product.fileObjectName, { ttl: 600 });
      return { freeDownloadUrl: signed.url };
    }

    // Paid product: create Stripe Checkout session
    const stripe = getStripe();

    // We attach a backend download endpoint as metadata so the frontend can read it from the session on success
    const downloadEndpoint = "/api/store/download"; // backend endpoint to get a signed download URL from session

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            unit_amount: product.priceCents,
            product_data: {
              name: product.title,
              description: product.description ?? undefined,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        product_id: product.id.toString(),
        download_url: downloadEndpoint,
      },
    });

    return { sessionId: session.id };
  }
);
