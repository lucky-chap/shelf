import { api, APIError } from "encore.dev/api";
import { ensureConfigured, mapPolarProduct, getPolarClient } from "./polar";

export interface ListProductsResponse {
  products: Array<{
    id: string;
    title: string;
    description: string | null;
    priceCents: number;
    priceCurrency: string;
    isFree: boolean;
    coverUrl: string | null;
    checkoutUrl: string | null;
  }>;
}

// Retrieves products from Polar for the configured organization.
export const listProducts = api<void, ListProductsResponse>(
  { expose: true, method: "GET", path: "/store/products" },
  async () => {
    ensureConfigured();
    const polar = getPolarClient();

    try {
      let products: any[] = [];

      // Try SDK method first
      if (polar.products && polar.products.list) {
        try {
          const res = await polar.products.list({
            isArchived: false,
          });
          
          // The SDK should return the products directly
          products = res.items || res.result || res.data || [];
        } catch (sdkError: any) {
          console.warn("SDK products list failed, trying direct API:", sdkError);
          
          // Fall back to direct API call
          const { key } = ensureConfigured();
          const response = await fetch("https://api.polar.sh/v1/products/?is_archived=false", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${key}`,
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Polar list products API error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          products = data.items || data.result || data.data || [];
        }
      } else {
        // SDK doesn't have the expected structure, use direct API
        const { key } = ensureConfigured();
        const response = await fetch("https://api.polar.sh/v1/products/?is_archived=false", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${key}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Polar list products API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        products = data.items || data.result || data.data || [];
      }

      const mappedProducts = products.map(mapPolarProduct);

      return { products: mappedProducts };
    } catch (error: any) {
      console.error("List products error:", error);
      
      if (error.message && error.message.includes("401")) {
        throw APIError.unauthenticated("Invalid Polar API key");
      }
      
      if (error.message && error.message.includes("403")) {
        throw APIError.permissionDenied("Insufficient permissions for Polar API");
      }
      
      if (error.message && error.message.includes("404")) {
        throw APIError.notFound("Polar organization not found");
      }
      
      throw APIError.internal(`Failed to list products: ${error.message || 'Unknown error'}`);
    }
  }
);
