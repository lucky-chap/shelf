import { api, APIError } from "encore.dev/api";
import { productsBucket } from "./storage";
import crypto from "crypto";

export interface UploadProductResponse {
  url: string;
  filename: string;
  downloadUrl: string;
}

// Uploads a digital product file and returns secure download URLs.
export const uploadProduct = api<void, UploadProductResponse>(
  { expose: true, method: "POST", path: "/uploads/product" },
  async (_, { body }) => {
    if (!body || body.length === 0) {
      throw APIError.invalidArgument("no file provided");
    }

    // Generate a unique filename
    const fileId = crypto.randomUUID();
    const filename = `product-${fileId}`;

    try {
      // Upload the file to the products bucket
      await productsBucket.upload(filename, body);

      // Generate a signed download URL (valid for 7 days)
      const downloadUrlResponse = await productsBucket.signedDownloadUrl(filename, {
        ttl: 7 * 24 * 60 * 60, // 7 days
      });

      // The URL for the file (not public, but can be used for management)
      const url = `/api/uploads/download/${filename}`;

      return {
        url,
        filename,
        downloadUrl: downloadUrlResponse.url,
      };
    } catch (error: any) {
      console.error("Failed to upload product:", error);
      throw APIError.internal("failed to upload product");
    }
  }
);
