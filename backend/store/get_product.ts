import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";

export interface GetProductParams {
  id: number;
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

// Retrieves a single product by ID.
export const getProduct = api<GetProductParams, Product>(
  { expose: true, method: "GET", path: "/store/products/:id" },
  async ({ id }) => {
    const product = await storeDB.queryRow<Product>`
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
      WHERE id = ${id}
    `;

    if (!product) {
      throw APIError.notFound("product not found");
    }

    return product;
  }
);
