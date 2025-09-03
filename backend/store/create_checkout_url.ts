import { api, APIError } from "encore.dev/api";
import { ensureConfigured, polarRequest } from "./polar";

export interface CreateCheckoutUrlRequest {
  productId: string;
  // Optional redirect URLs for after checkout (Polar should support this)
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutUrlResponse {
  url: string;
}

// Creates a checkout session with Polar and returns a redirect URL for the product.
export const createCheckoutUrl = api<CreateCheckoutUrlRequest, CreateCheckoutUrlResponse>(
  { expose: true, method: "POST", path: "/store/checkout-url" },
  async ({ productId, successUrl, cancelUrl }) => {
    ensureConfigured();
    if (!productId) {
      throw APIError.invalidArgument("productId is required");
    }

    // Attempt a generic checkout session creation.
    // If Polar uses a different endpoint, Polar's error will be returned clearly.
    const resp = await polarRequest<any>("/v1/checkouts/sessions", {
      method: "POST",
      body: JSON.stringify({
        product_id: productId,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });

    const url: string | undefined = resp?.url || resp?.checkout_url || resp?.hosted_url;
    if (!url) {
      throw APIError.internal("Polar did not return a checkout URL");
    }

    return { url };
  }
);
