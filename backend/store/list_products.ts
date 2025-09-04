import { api } from "encore.dev/api";
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
    // We still call ensureConfigured to validate credentials, but don't use the org ID in the request
    ensureConfigured();
    const polar = getPolarClient();

    try {
      // Use the SDK to list products without specifying organizationId
      // When using an organization token, the organization is automatically determined
      const res = await polar.products.list({
        isArchived: false,
      });

      // The SDK should return the products directly
      const products = res.items || res.result || [];
      const mappedProducts = products.map(mapPolarProduct);

      return { products: mappedProducts };
    } catch (error: any) {
      console.error("List products error:", error);
      
      if (error.statusCode === 401) {
        throw new Error("Invalid Polar API key");
      }
      
      if (error.statusCode === 403) {
        throw new Error("Insufficient permissions for Polar API");
      }
      
      if (error.statusCode === 404) {
        throw new Error("Polar organization not found");
      }
      
      throw new Error(`Failed to list products: ${error.message || 'Unknown error'}`);
    }
  }
);
