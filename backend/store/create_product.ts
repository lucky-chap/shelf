import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";

export interface CreateProductRequest {
  title: string;
  description?: string;
  priceCents: number;
  coverImageUrl?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
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

// Creates a new product.
export const createProduct = api<CreateProductRequest, Product>(
  { expose: true, method: "POST", path: "/store/products" },
  async (req) => {
    // Validate price (0 for free, or minimum $1 = 100 cents)
    if (req.priceCents < 0) {
      throw APIError.invalidArgument("price cannot be negative");
    }
    if (req.priceCents > 0 && req.priceCents < 100) {
      throw APIError.invalidArgument("paid products must be at least $1 (100 cents)");
    }

    // Get the next sort order
    const maxSortOrder = await storeDB.queryRow<{ max: number | null }>`
      SELECT MAX(sort_order) as max FROM products
    `;
    
    const nextSortOrder = (maxSortOrder?.max || 0) + 1;

    const product = await storeDB.queryRow<Product>`
      INSERT INTO products (
        title, 
        description, 
        price_cents,
        cover_image_url,
        file_url,
        file_name,
        file_size,
        sort_order
      )
      VALUES (
        ${req.title}, 
        ${req.description || null}, 
        ${req.priceCents},
        ${req.coverImageUrl || null},
        ${req.fileUrl},
        ${req.fileName},
        ${req.fileSize},
        ${nextSortOrder}
      )
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
      throw APIError.internal("failed to create product");
    }

    return product;
  }
);
