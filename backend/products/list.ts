import { api } from "encore.dev/api";
import { productsDB } from "./db";

export interface Product {
  id: number;
  title: string;
  description: string | null;
  priceCents: number;
  downloadUrl: string;
  previewImageUrl: string | null;
  fileSizeBytes: number | null;
  fileType: string | null;
  isActive: boolean;
  purchaseCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProductsResponse {
  products: Product[];
}

// Retrieves all active products.
export const list = api<void, ListProductsResponse>(
  { expose: true, method: "GET", path: "/products" },
  async () => {
    const products = await productsDB.queryAll<Product>`
      SELECT id, title, description, price_cents as "priceCents", download_url as "downloadUrl", preview_image_url as "previewImageUrl", file_size_bytes as "fileSizeBytes", file_type as "fileType", is_active as "isActive", purchase_count as "purchaseCount", created_at as "createdAt", updated_at as "updatedAt"
      FROM products 
      WHERE is_active = true
      ORDER BY created_at DESC
    `;

    return { products };
  }
);
