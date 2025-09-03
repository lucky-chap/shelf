import { api, APIError } from "encore.dev/api";
import { productFiles } from "./storage";

export interface UploadFileRequest {
  filename: string;
  contentType: string;
  data: string; // base64 encoded binary data
}

export interface UploadFileResponse {
  downloadUrl: string;
}

// Uploads a digital file for a product and returns a secure download URL.
export const uploadFile = api<UploadFileRequest, UploadFileResponse>(
  { expose: true, method: "POST", path: "/products/upload-file" },
  async (req) => {
    if (!req.filename) {
      throw APIError.invalidArgument("filename is required");
    }

    if (!req.data) {
      throw APIError.invalidArgument("file data is required");
    }

    try {
      // Decode base64 data to buffer
      const buffer = Buffer.from(req.data, 'base64');
      
      // Validate file size (max 50MB)
      if (buffer.length > 50 * 1024 * 1024) {
        throw APIError.invalidArgument("file must be smaller than 50MB");
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const extension = req.filename.split('.').pop() || 'bin';
      const objectName = `files/${timestamp}-${randomStr}.${extension}`;

      await productFiles.upload(objectName, buffer, {
        contentType: req.contentType,
      });

      // Generate a signed download URL (valid for 7 days)
      const signedUrl = await productFiles.signedDownloadUrl(objectName, {
        ttl: 7 * 24 * 60 * 60 // 7 days in seconds
      });

      return { downloadUrl: signedUrl.url };
    } catch (error: any) {
      console.error("Failed to upload file:", error);
      throw APIError.internal("failed to upload file");
    }
  }
);
