import { api, APIError } from "encore.dev/api";
import { productsDB } from "./db";

export interface CreateProductRequest {
  title: string;
  description?: string;
  priceCents: number;
  downloadUrl: string;
  previewImageUrl?: string;
}

export interface Product {
  id: number;
  title: string;
  description: string | null;
  priceCents: number;
  downloadUrl: string;
  previewImageUrl: string | null;
  isActive: boolean;
  purchaseCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new product.
export const create = api<CreateProductRequest, Product>(
  { expose: true, method: "POST", path: "/products" },
  async (req) => {
    if (!req.downloadUrl) {
      throw APIError.invalidArgument("download URL is required");
    }

    // Validate that downloadUrl is an external URL
    try {
      const url = new URL(req.downloadUrl);
      if (!url.protocol.startsWith('http')) {
        throw APIError.invalidArgument("download URL must be a valid HTTP(S) URL");
      }
    } catch (error) {
      throw APIError.invalidArgument("download URL must be a valid HTTP(S) URL");
    }

    // Validate preview URL if provided
    if (req.previewImageUrl) {
      try {
        const url = new URL(req.previewImageUrl);
        if (!url.protocol.startsWith('http')) {
          throw APIError.invalidArgument("preview image URL must be a valid HTTP(S) URL");
        }
      } catch (error) {
        throw APIError.invalidArgument("preview image URL must be a valid HTTP(S) URL");
      }
    }

    const product = await productsDB.queryRow<Product>`
      INSERT INTO products (title, description, price_cents, download_url, preview_image_url)
      VALUES (${req.title}, ${req.description || null}, ${req.priceCents}, ${req.downloadUrl}, ${req.previewImageUrl || null})
      RETURNING id, title, description, price_cents as "priceCents", download_url as "downloadUrl", preview_image_url as "previewImageUrl", is_active as "isActive", purchase_count as "purchaseCount", created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!product) {
      throw APIError.internal("failed to create product");
    }

    return product;
  }
);
