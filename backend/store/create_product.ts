import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { productCoversBucket, productFilesBucket } from "./storage";
import type { Product } from "./types";

export interface CreateProductRequest {
  title: string;
  description?: string;
  priceCents: number; // 0 for free
  currency?: string; // default 'usd'
  fileObjectName: string; // must have been uploaded to productFilesBucket
  coverObjectName?: string; // optional, uploaded to productCoversBucket
}

export interface CreateProductResponse extends Product {}

// Creates a new digital product with secure file references.
export const createProduct = api<CreateProductRequest, CreateProductResponse>(
  { expose: true, method: "POST", path: "/store/products" },
  async (req) => {
    if (!req.title || !req.fileObjectName) {
      throw APIError.invalidArgument("title and fileObjectName are required");
    }
    if (req.priceCents < 0) {
      throw APIError.invalidArgument("priceCents must be >= 0");
    }

    // Verify the file exists in the private bucket
    const fileExists = await productFilesBucket.exists(req.fileObjectName);
    if (!fileExists) {
      throw APIError.invalidArgument("file was not uploaded or object name is invalid");
    }

    // Resolve cover URL if provided
    let coverUrl: string | null = null;
    if (req.coverObjectName) {
      const coverExists = await productCoversBucket.exists(req.coverObjectName);
      if (!coverExists) {
        throw APIError.invalidArgument("cover was not uploaded or object name is invalid");
      }
      coverUrl = productCoversBucket.publicUrl(req.coverObjectName);
    }

    const row = await storeDB.queryRow<Product>`
      INSERT INTO products (
        title, description, price_cents, currency,
        file_object_name, cover_object_name, cover_url, active
      ) VALUES (
        ${req.title},
        ${req.description || null},
        ${req.priceCents},
        ${req.currency || "usd"},
        ${req.fileObjectName},
        ${req.coverObjectName || null},
        ${coverUrl},
        true
      )
      RETURNING
        id,
        title,
        description,
        price_cents as "priceCents",
        currency,
        file_object_name as "fileObjectName",
        cover_object_name as "coverObjectName",
        cover_url as "coverUrl",
        active,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    if (!row) {
      throw APIError.internal("failed to create product");
    }

    return row;
  }
);
