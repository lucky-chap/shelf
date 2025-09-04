import { api, APIError } from "encore.dev/api";
import { ensureConfigured, getPolarClient } from "./polar";

export interface CreateCheckoutUrlRequest {
  productId: string;
  // Optional redirect URLs for after checkout
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
    const polar = getPolarClient();
    
    if (!productId) {
      throw APIError.invalidArgument("productId is required");
    }

    try {
      let checkoutSession: any;

      // Try SDK method first
      if (polar.checkouts && polar.checkouts.create) {
        try {
          checkoutSession = await polar.checkouts.create({
            productId: productId,
            successUrl: successUrl,
            cancelUrl: cancelUrl,
          });
        } catch (sdkError: any) {
          console.warn("SDK checkout creation failed, trying direct API:", sdkError);
          
          // Fall back to direct API call
          const { key } = ensureConfigured();
          const payload: any = { product_id: productId };
          if (successUrl) payload.success_url = successUrl;
          if (cancelUrl) payload.cancel_url = cancelUrl;

          const response = await fetch("https://api.polar.sh/v1/checkouts/", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Polar checkout API error ${response.status}: ${errorText}`);
          }

          checkoutSession = await response.json();
        }
      } else {
        // SDK doesn't have the expected structure, use direct API
        const { key } = ensureConfigured();
        const payload: any = { product_id: productId };
        if (successUrl) payload.success_url = successUrl;
        if (cancelUrl) payload.cancel_url = cancelUrl;

        const response = await fetch("https://api.polar.sh/v1/checkouts/", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Polar checkout API error ${response.status}: ${errorText}`);
        }

        checkoutSession = await response.json();
      }

      const url: string = checkoutSession.url;
      if (!url) {
        throw APIError.internal("Polar did not return a checkout URL");
      }

      return { url };
    } catch (error: any) {
      console.error("Create checkout error:", error);
      
      if (error.message && error.message.includes("401")) {
        throw APIError.unauthenticated("Invalid Polar API key");
      }
      
      if (error.message && error.message.includes("403")) {
        throw APIError.permissionDenied("Insufficient permissions for Polar API");
      }
      
      if (error.message && error.message.includes("404")) {
        throw APIError.notFound("Product not found");
      }
      
      if (error.message && error.message.includes("422")) {
        throw APIError.invalidArgument("Invalid checkout data");
      }
      
      throw APIError.internal(`Failed to create checkout: ${error.message || 'Unknown error'}`);
    }
  }
);
