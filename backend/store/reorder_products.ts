import { api } from "encore.dev/api";
import { storeDB } from "./db";

export interface ReorderProductsRequest {
  productIds: number[];
}

export interface Product {
  id: number;
  title: string;
  description: string | null;
  priceCents: number;
  coverImageUrl: string | null;
  fileName: string;
  fileSize: number;
  isActive: boolean;
  sortOrder: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReorderProductsResponse {
  products: Product[];
}

// Reorders products based on the provided array of product IDs.
export const reorderProducts = api<ReorderProductsRequest, ReorderProductsResponse>(
  { expose: true, method: "PUT", path: "/store/products/reorder" },
  async ({ productIds }) => {
    // Update sort order for each product
    for (let i = 0; i < productIds.length; i++) {
      await storeDB.exec`
        UPDATE products 
        SET sort_order = ${i + 1}, updated_at = NOW()
        WHERE id = ${productIds[i]}
      `;
    }

    // Return updated products
    const products = await storeDB.queryAll<Product>`
      SELECT 
        id, 
        title, 
        description, 
        price_cents as "priceCents",
        cover_image_url as "coverImageUrl",
        file_name as "fileName",
        file_size as "fileSize",
        is_active as "isActive",
        sort_order as "sortOrder",
        download_count as "downloadCount",
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM products 
      WHERE is_active = true
      ORDER BY sort_order ASC
    `;

    return { products };
  }
);
