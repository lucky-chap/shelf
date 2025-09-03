import { api, APIError } from "encore.dev/api";
import { productCovers } from "./storage";

export interface UploadCoverRequest {
  filename: string;
  contentType: string;
  data: string; // base64 encoded binary data
}

export interface UploadCoverResponse {
  url: string;
}

// Uploads a cover image for a product.
export const uploadCover = api<UploadCoverRequest, UploadCoverResponse>(
  { expose: true, method: "POST", path: "/products/upload-cover" },
  async (req) => {
    if (!req.filename) {
      throw APIError.invalidArgument("filename is required");
    }

    if (!req.data) {
      throw APIError.invalidArgument("file data is required");
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(req.contentType)) {
      throw APIError.invalidArgument("only image files are allowed for covers");
    }

    try {
      // Decode base64 data to buffer
      const buffer = Buffer.from(req.data, 'base64');
      
      // Validate file size (max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        throw APIError.invalidArgument("cover image must be smaller than 5MB");
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const extension = req.filename.split('.').pop() || 'jpg';
      const objectName = `covers/${timestamp}-${randomStr}.${extension}`;

      await productCovers.upload(objectName, buffer, {
        contentType: req.contentType,
      });

      const url = productCovers.publicUrl(objectName);
      return { url };
    } catch (error: any) {
      console.error("Failed to upload cover image:", error);
      throw APIError.internal("failed to upload cover image");
    }
  }
);
