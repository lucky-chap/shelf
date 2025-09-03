import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { productFilesBucket } from "./storage";

export interface FreeDownloadRequest {
  productId: number;
}

export interface FreeDownloadResponse {
  url: string; // short-lived signed download URL
}

// Generates a secure download URL for a free product.
export const freeDownload = api<FreeDownloadRequest, FreeDownloadResponse>(
  { expose: true, method: "POST", path: "/store/free-download" },
  async ({ productId }) => {
    const product = await storeDB.queryRow<{
      id: number;
      priceCents: number;
      fileObjectName: string;
      active: boolean;
    }>`
      SELECT id, price_cents as "priceCents", file_object_name as "fileObjectName", active
      FROM products
      WHERE id = ${productId}
    `;

    if (!product || !product.active) {
      throw APIError.notFound("product not found");
    }
    if (product.priceCents !== 0) {
      throw APIError.failedPrecondition("product is not free");
    }

    const signed = await productFilesBucket.signedDownloadUrl(product.fileObjectName, { ttl: 600 });
    return { url: signed.url };
  }
);
