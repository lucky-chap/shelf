import { api, APIError } from "encore.dev/api";
import { purchasesDB } from "./db";

export interface DownloadParams {
  token: string;
}

export interface DownloadResponse {
  downloadUrl: string;
  filename: string;
  remainingDownloads: number;
}

// Validates a download token and returns the download URL.
export const download = api<DownloadParams, DownloadResponse>(
  { expose: true, method: "GET", path: "/purchases/download/:token" },
  async ({ token }) => {
    const purchase = await purchasesDB.queryRow<{
      id: number;
      downloadCount: number;
      maxDownloads: number;
      downloadExpiresAt: Date;
      downloadUrl: string;
      title: string;
    }>`
      SELECT p.id, p.download_count as "downloadCount", p.max_downloads as "maxDownloads", p.download_expires_at as "downloadExpiresAt", pr.download_url as "downloadUrl", pr.title
      FROM purchases p
      JOIN products pr ON p.product_id = pr.id
      WHERE p.download_token = ${token}
    `;

    if (!purchase) {
      throw APIError.notFound("invalid download token");
    }

    // Check if download has expired
    if (new Date() > purchase.downloadExpiresAt) {
      throw APIError.failedPrecondition("download link has expired");
    }

    // Check if download limit reached
    if (purchase.downloadCount >= purchase.maxDownloads) {
      throw APIError.resourceExhausted("download limit reached");
    }

    // Increment download count
    await purchasesDB.exec`
      UPDATE purchases 
      SET download_count = download_count + 1
      WHERE id = ${purchase.id}
    `;

    return {
      downloadUrl: purchase.downloadUrl,
      filename: purchase.title,
      remainingDownloads: purchase.maxDownloads - purchase.downloadCount - 1
    };
  }
);
