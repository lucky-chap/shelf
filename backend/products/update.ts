import { api, APIError } from "encore.dev/api";
import { productsDB } from "./db";

export interface UpdateProductRequest {
  id: number;
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

// Updates an existing product.
export const update = api<UpdateProductRequest, Product>(
  { expose: true, method: "PUT", path: "/products/:id" },
  async (req) => {
    const product = await productsDB.queryRow<Product>`
      UPDATE products 
      SET title = ${req.title}, 
          description = ${req.description || null}, 
          price_cents = ${req.priceCents}, 
          download_url = ${req.downloadUrl}, 
          preview_image_url = ${req.previewImageUrl || null}, 
          file_size_bytes = ${req.fileSizeBytes || null}, 
          file_type = ${req.fileType || null}, 
          updated_at = NOW()
      WHERE id = ${req.id}
      RETURNING id, title, description, price_cents as "priceCents", download_url as "downloadUrl", preview_image_url as "previewImageUrl", file_size_bytes as "fileSizeBytes", file_type as "fileType", is_active as "isActive", purchase_count as "purchaseCount", created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!product) {
      throw APIError.notFound("product not found");
    }

    return product;
  }
);
