import { api } from "encore.dev/api";
import { storeDB } from "./db";
import type { PublicProduct } from "./types";

export interface ListProductsResponse {
  products: PublicProduct[];
}

// Lists public products (without exposing file object names).
export const listProducts = api<void, ListProductsResponse>(
  { expose: true, method: "GET", path: "/store/products" },
  async () => {
    const products = await storeDB.queryAll<PublicProduct>`
      SELECT
        id,
        title,
        description,
        price_cents as "priceCents",
        currency,
        cover_url as "coverUrl"
      FROM products
      WHERE active = true
      ORDER BY created_at DESC
    `;

    return { products };
  }
);
