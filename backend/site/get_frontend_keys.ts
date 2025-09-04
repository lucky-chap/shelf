import { api } from "encore.dev/api";
import { storeDB } from "./db";

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

export interface ListProductsResponse {
  products: Product[];
}

// Retrieves all active products ordered by sort order.
export const listProducts = api<void, ListProductsResponse>(
  { expose: true, method: "GET", path: "/store/products" },
  async () => {
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
      ORDER BY sort_order ASC, created_at DESC
    `;

    return { products };
  }
);
