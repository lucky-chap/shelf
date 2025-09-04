import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";

export interface UpdateProductRequest {
  id: number;
  title: string;
  description?: string;
  priceCents: number;
  coverImageUrl?: string;
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

// Updates an existing product.
export const updateProduct = api<UpdateProductRequest, Product>(
  { expose: true, method: "PUT", path: "/store/products/:id" },
  async (req) => {
    // Validate price (0 for free, or minimum $1 = 100 cents)
    if (req.priceCents < 0) {
      throw APIError.invalidArgument("price cannot be negative");
    }
    if (req.priceCents > 0 && req.priceCents < 100) {
      throw APIError.invalidArgument("paid products must be at least $1 (100 cents)");
    }

    const product = await storeDB.queryRow<Product>`
      UPDATE products 
      SET 
        title = ${req.title}, 
        description = ${req.description || null}, 
        price_cents = ${req.priceCents},
        cover_image_url = ${req.coverImageUrl || null},
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING 
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
    `;

    if (!product) {
      throw APIError.notFound("product not found");
    }

    return product;
  }
);
