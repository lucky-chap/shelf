import { api } from "encore.dev/api";
import { storeDB } from "./db";
import type { Product } from "./types";

export interface ListProductsAdminResponse {
  products: Product[];
}

// Lists all products for admin (no auth enforced here).
export const listProductsAdmin = api<void, ListProductsAdminResponse>(
  { expose: true, method: "GET", path: "/store/admin/products" },
  async () => {
    const products = await storeDB.queryAll<Product>`
      SELECT
        id,
        title,
        description,
        price_cents as "priceCents",
        currency,
        file_object_name as "fileObjectName",
        cover_object_name as "coverObjectName",
        cover_url as "coverUrl",
        active,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM products
      ORDER BY created_at DESC
    `;
    return { products };
  }
);
