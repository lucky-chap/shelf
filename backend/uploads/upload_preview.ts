import { api, APIError } from "encore.dev/api";
import { previewsBucket } from "./storage";
import crypto from "crypto";

export interface UploadPreviewResponse {
  url: string;
  filename: string;
}

// Uploads a product preview image and returns the public URL.
export const uploadPreview = api<void, UploadPreviewResponse>(
  { expose: true, method: "POST", path: "/uploads/preview" },
  async (_, { body }) => {
    if (!body || body.length === 0) {
      throw APIError.invalidArgument("no file provided");
    }

    // Generate a unique filename
    const fileId = crypto.randomUUID();
    const filename = `preview-${fileId}.jpg`;

    try {
      // Upload the file to the previews bucket
      await previewsBucket.upload(filename, body, {
        contentType: "image/jpeg",
      });

      // Return the public URL
      const url = previewsBucket.publicUrl(filename);

      return {
        url,
        filename,
      };
    } catch (error: any) {
      console.error("Failed to upload preview:", error);
      throw APIError.internal("failed to upload preview");
    }
  }
);
