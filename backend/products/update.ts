import { api, APIError } from "encore.dev/api";
import { productsDB } from "./db";

export interface UpdateProductRequest {
  id: number;
  title: string;
  description: string;
  priceCents: number;
  coverUrl: string;
  downloadUrl: string;
}

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

// Updates an existing product.
export const update = api<UpdateProductRequest, Product>(
  { expose: true, method: "PUT", path: "/products/:id" },
  async (req) => {
    if (!req.title.trim()) {
      throw APIError.invalidArgument("title is required");
    }

    if (!req.description.trim()) {
      throw APIError.invalidArgument("description is required");
    }

    if (req.priceCents < 0) {
      throw APIError.invalidArgument("price cannot be negative");
    }

    if (req.priceCents > 0 && req.priceCents < 50) {
      throw APIError.invalidArgument("paid products must be at least $0.50 (50 cents)");
    }

    if (!req.coverUrl.trim()) {
      throw APIError.invalidArgument("cover image URL is required");
    }

    if (!req.downloadUrl.trim()) {
      throw APIError.invalidArgument("download URL is required");
    }

    const product = await productsDB.queryRow<Product>`
      UPDATE products 
      SET 
        title = ${req.title.trim()}, 
        description = ${req.description.trim()}, 
        price_cents = ${req.priceCents}, 
        cover_url = ${req.coverUrl},
        download_url = ${req.downloadUrl},
        updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING 
        id, 
        title, 
        description, 
        price_cents as "priceCents", 
        cover_url as "coverUrl",
        download_url as "downloadUrl",
        is_active as "isActive", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;

    if (!product) {
      throw APIError.notFound("product not found");
    }

    return product;
  }
);
