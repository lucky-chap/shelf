import { api } from "encore.dev/api";
import { storeDB } from "./db";
import type { ListProductsResponse } from "./types";

// Lists active products for the public page.
export const listProducts = api<void, ListProductsResponse>(
  { expose: true, method: "GET", path: "/store/products" },
  async () => {
    const products = await storeDB.queryAll<ListProductsResponse["products"][number]>`
      SELECT
        id,
        title,
        description,
        price_cents as "priceCents",
        cover_url as "coverUrl",
        is_active as "isActive",
        created_at as "createdAt"
      FROM products
      WHERE is_active = true
      ORDER BY created_at DESC
    `;
    return { products };
  }
);
