import { api, APIError } from "encore.dev/api";
import { productsDB } from "./db";

export interface CreateProductRequest {
  title: string;
  description?: string;
  priceCents: number;
  downloadUrl: string;
  previewImageUrl?: string;
  fileSizeBytes?: number;
  fileType?: string;
}

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

// Creates a new product.
export const create = api<CreateProductRequest, Product>(
  { expose: true, method: "POST", path: "/products" },
  async (req) => {
    const product = await productsDB.queryRow<Product>`
      INSERT INTO products (title, description, price_cents, download_url, preview_image_url, file_size_bytes, file_type)
      VALUES (${req.title}, ${req.description || null}, ${req.priceCents}, ${req.downloadUrl}, ${req.previewImageUrl || null}, ${req.fileSizeBytes || null}, ${req.fileType || null})
      RETURNING id, title, description, price_cents as "priceCents", download_url as "downloadUrl", preview_image_url as "previewImageUrl", file_size_bytes as "fileSizeBytes", file_type as "fileType", is_active as "isActive", purchase_count as "purchaseCount", created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!product) {
      throw APIError.internal("failed to create product");
    }

    return product;
  }
);
