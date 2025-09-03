import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { productCovers, productFiles } from "./buckets";
import type { UpdateProductRequest, Product } from "./types";

// Updates an existing product. Optional new uploads can be provided by object names.
export const updateProduct = api<UpdateProductRequest, Product>(
  { expose: true, method: "PUT", path: "/store/products/:id" },
  async (req) => {
    const existing = await storeDB.queryRow<Product>`
      SELECT
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
      FROM products
      WHERE id = ${req.id}
    `;
    if (!existing) throw APIError.notFound("product not found");

    let coverUrl = existing.coverUrl;
    let coverKey = existing.coverKey;
    if (req.coverObjectName !== undefined) {
      if (req.coverObjectName === null) {
        coverKey = null;
        coverUrl = null;
      } else {
        try {
          await productCovers.attrs(req.coverObjectName);
          coverKey = req.coverObjectName;
          coverUrl = productCovers.publicUrl(req.coverObjectName);
        } catch {
          coverKey = null;
          coverUrl = null;
        }
      }
    }

    let fileKey = existing.fileKey;
    if (req.fileObjectName) {
      try {
        await productFiles.attrs(req.fileObjectName);
        fileKey = req.fileObjectName;
      } catch {
        throw APIError.invalidArgument("file object does not exist");
      }
    }

    const newPrice = req.priceCents !== undefined ? Math.max(0, Math.floor(req.priceCents)) : existing.priceCents;

    // Generate a fresh download URL if file changed or on every update for safety
    const downloadSigned = await productFiles.signedDownloadUrl(fileKey, { ttl: 24 * 3600 });

    const updated = await storeDB.queryRow<Product>`
      UPDATE products
      SET
        title = ${req.title ?? existing.title},
        description = ${req.description ?? existing.description},
        price_cents = ${newPrice},
        cover_key = ${coverKey},
        cover_url = ${coverUrl},
        file_key = ${fileKey},
        download_url = ${downloadSigned.url},
        is_active = ${req.isActive ?? existing.isActive},
        updated_at = NOW()
      WHERE id = ${req.id}
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

    if (!updated) {
      throw APIError.internal("failed to update product");
    }
    return updated;
  }
);
