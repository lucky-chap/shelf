import { api, APIError } from "encore.dev/api";
import { productsDB } from "./db";

export interface CreateProductRequest {
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

// Creates a new digital product.
export const create = api<CreateProductRequest, Product>(
  { expose: true, method: "POST", path: "/products" },
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
      INSERT INTO products (title, description, price_cents, cover_url, download_url)
      VALUES (${req.title.trim()}, ${req.description.trim()}, ${req.priceCents}, ${req.coverUrl}, ${req.downloadUrl})
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
      throw APIError.internal("failed to create product");
    }

    return product;
  }
);
