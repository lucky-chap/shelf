import { api, APIError } from "encore.dev/api";
import { productsBucket } from "./storage";

export interface DownloadProductParams {
  filename: string;
}

// Downloads a product file by filename (for internal use).
export const downloadProduct = api<DownloadProductParams, void>(
  { expose: true, method: "GET", path: "/uploads/download/:filename" },
  async ({ filename }, { response }) => {
    try {
      // Check if file exists
      const exists = await productsBucket.exists(filename);
      if (!exists) {
        throw APIError.notFound("file not found");
      }

      // Generate a signed download URL and redirect
      const downloadUrlResponse = await productsBucket.signedDownloadUrl(filename, {
        ttl: 3600, // 1 hour
      });

      // Redirect to the signed URL
      response.writeHead(302, {
        Location: downloadUrlResponse.url,
      });
      response.end();
    } catch (error: any) {
      console.error("Failed to download product:", error);
      throw APIError.internal("failed to download product");
    }
  }
);
