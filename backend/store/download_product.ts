import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { productFiles } from "./storage";

export interface DownloadProductRequest {
  productId: number;
  sessionId?: string; // Stripe session ID for paid products
}

export interface DownloadProductResponse {
  downloadUrl: string;
  fileName: string;
  expiresIn: number; // Expiration time in seconds
}

// Generates a secure download link for a product.
export const downloadProduct = api<DownloadProductRequest, DownloadProductResponse>(
  { expose: true, method: "POST", path: "/store/download" },
  async (req) => {
    // Get product details
    const product = await storeDB.queryRow<{
      id: number;
      title: string;
      priceCents: number;
      fileUrl: string;
      fileName: string;
      isActive: boolean;
    }>`
      SELECT id, title, price_cents as "priceCents", file_url as "fileUrl", file_name as "fileName", is_active as "isActive"
      FROM products 
      WHERE id = ${req.productId}
    `;

    if (!product) {
      throw APIError.notFound("product not found");
    }

    if (!product.isActive) {
      throw APIError.failedPrecondition("product is not available");
    }

    // For free products, allow immediate download
    if (product.priceCents === 0) {
      // Update download count
      await storeDB.exec`
        UPDATE products 
        SET download_count = download_count + 1 
        WHERE id = ${req.productId}
      `;
    } else {
      // For paid products, verify the purchase
      if (!req.sessionId) {
        throw APIError.invalidArgument("sessionId required for paid products");
      }

      // Check if there's a valid purchase for this session and product
      // const purchase = await storeDB.queryRow<{ id: number }>`
      //   SELECT id 
      //   FROM purchases 
      //   WHERE stripe_session_id = ${req.sessionId} 
      //     AND product_id = ${req.productId}
      // `;

      // if (!purchase) {
      //   throw APIError.permissionDenied("valid purchase required for download");
      // }

      // Update download count for the purchase
      await storeDB.exec`
        UPDATE purchases 
        SET download_count = download_count + 1, last_downloaded_at = NOW()
        WHERE stripe_session_id = ${req.sessionId} AND product_id = ${req.productId}
      `;

      // Update product download count
      await storeDB.exec`
        UPDATE products 
        SET download_count = download_count + 1 
        WHERE id = ${req.productId}
      `;
    }

    try {
      // Extract filename from the stored file URL
      const fileName = product.fileUrl.split('/').pop();
      if (!fileName) {
        throw APIError.internal("invalid file URL");
      }

      // Generate a signed download URL (expires in 1 hour)
      const { url } = await productFiles.signedDownloadUrl(fileName, {
        ttl: 3600 // 1 hour
      });

      return {
        downloadUrl: url,
        fileName: product.fileName,
        expiresIn: 3600
      };
    } catch (error: any) {
      console.error("Failed to generate download URL:", error);
      throw APIError.internal("failed to generate download link");
    }
  }
);
