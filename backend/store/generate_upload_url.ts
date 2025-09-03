import { api, APIError } from "encore.dev/api";
import { productCovers, productFiles } from "./buckets";
import crypto from "crypto";

export interface GenerateUploadUrlRequest {
  type: "cover" | "file";
  filename: string;
  contentType?: string;
}

export interface GenerateUploadUrlResponse {
  url: string;
  objectName: string;
  publicUrl?: string; // returned for covers
}

// Generates a signed upload URL for either a cover image or a product file.
export const generateUploadUrl = api<GenerateUploadUrlRequest, GenerateUploadUrlResponse>(
  { expose: true, method: "POST", path: "/store/upload-url" },
  async (req) => {
    if (!req.filename) {
      throw APIError.invalidArgument("filename is required");
    }
    if (req.type !== "cover" && req.type !== "file") {
      throw APIError.invalidArgument("type must be 'cover' or 'file'");
    }

    const sanitized = sanitizeFilename(req.filename);
    const objectName = `${req.type}s/${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${sanitized}`;

    if (req.type === "cover") {
      const { url } = await productCovers.signedUploadUrl(objectName, { ttl: 3600 });
      // Since covers bucket is public, we can provide the public URL directly
      let publicUrl: string | undefined;
      try {
        publicUrl = productCovers.publicUrl(objectName);
      } catch {
        // ignore if bucket not public
      }
      return { url, objectName, publicUrl };
    } else {
      const { url } = await productFiles.signedUploadUrl(objectName, { ttl: 3600 });
      return { url, objectName };
    }
  }
);

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 200);
}
