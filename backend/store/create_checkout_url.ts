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
      // Use the SDK to create a checkout session
      const checkoutSession = await polar.checkouts.create({
        productId: productId,
        successUrl: successUrl,
        cancelUrl: cancelUrl,
      });

      const url: string = checkoutSession.url;
      if (!url) {
        throw APIError.internal("Polar did not return a checkout URL");
      }

      return { url };
    } catch (error: any) {
      console.error("Create checkout error:", error);
      
      if (error.statusCode === 401) {
        throw APIError.unauthenticated("Invalid Polar API key");
      }
      
      if (error.statusCode === 403) {
        throw APIError.permissionDenied("Insufficient permissions for Polar API");
      }
      
      if (error.statusCode === 404) {
        throw APIError.notFound("Product not found");
      }
      
      if (error.statusCode === 422) {
        throw APIError.invalidArgument("Invalid checkout data");
      }
      
      throw APIError.internal(`Failed to create checkout: ${error.message || 'Unknown error'}`);
    }
  }
);
