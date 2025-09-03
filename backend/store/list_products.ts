import { api } from "encore.dev/api";
import { ensureConfigured, mapPolarProduct, polarRequest, PolarListProductsResponse } from "./polar";

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
    const { org } = ensureConfigured();

    // Attempt to fetch products. Polar's API may use `items`, `data` or `results`.
    const res = await polarRequest<PolarListProductsResponse>(
      `/v1/products?organization_id=${encodeURIComponent(org)}&active=true`
    );

    const arr = res.items || res.data || res.results || [];
    const products = arr.map(mapPolarProduct);

    return { products };
  }
);
