import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { productCovers, productFiles } from "./buckets";
import type { CreateProductRequest, Product } from "./types";

// Creates a new product using previously uploaded cover and file objects.
export const createProduct = api<CreateProductRequest, Product>(
  { expose: true, method: "POST", path: "/store/products" },
  async (req) => {
    if (!req.title) throw APIError.invalidArgument("title is required");
    if (!req.fileObjectName) throw APIError.invalidArgument("fileObjectName is required");
    const priceCents = Math.max(0, Math.floor(req.priceCents ?? 0));

    // Validate object existence
    try {
      await productFiles.attrs(req.fileObjectName);
    } catch {
      throw APIError.invalidArgument("file object does not exist");
    }

    let coverUrl: string | null = null;
    if (req.coverObjectName) {
      try {
        await productCovers.attrs(req.coverObjectName);
        coverUrl = productCovers.publicUrl(req.coverObjectName);
      } catch {
        // If cover is missing or bucket not public, just ignore
        coverUrl = null;
      }
    }

    // Generate an initial secure download URL (expires). We store it for convenience.
    // On purchase we will generate a fresh URL as needed.
    const downloadSigned = await productFiles.signedDownloadUrl(req.fileObjectName, { ttl: 24 * 3600 });

    const row = await storeDB.queryRow<Product>`
      INSERT INTO products (
        title, description, price_cents, cover_key, cover_url, file_key, download_url, is_active
      )
      VALUES (
        ${req.title},
        ${req.description ?? null},
        ${priceCents},
        ${req.coverObjectName ?? null},
        ${coverUrl},
        ${req.fileObjectName},
        ${downloadSigned.url},
        true
      )
      RETURNING
        id,
        title,
        description,
        price_cents as "priceCents",
        cover_url as "coverUrl",
        cover_key as "coverKey",
        file_key as "fileKey",
        download_url as "downloadUrl",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    if (!row) {
      throw APIError.internal("failed to create product");
    }
    return row;
  }
);
