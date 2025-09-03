import { api } from "encore.dev/api";
import { productsDB } from "./db";

export interface Product {
  id: number;
  title: string;
  description: string;
  priceCents: number;
  coverUrl: string;
  downloadUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProductsResponse {
  products: Product[];
}

// Retrieves all active products for public display.
export const list = api<void, ListProductsResponse>(
  { expose: true, method: "GET", path: "/products" },
  async () => {
    const products = await productsDB.queryAll<Product>`
      SELECT 
        id, 
        title, 
        description, 
        price_cents as "priceCents", 
        cover_url as "coverUrl",
        download_url as "downloadUrl",
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM products 
      WHERE is_active = true
      ORDER BY created_at DESC
    `;

    return { products };
  }
);
