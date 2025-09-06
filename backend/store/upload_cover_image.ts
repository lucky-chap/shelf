import { api, APIError } from "encore.dev/api";
import { productAssets } from "./storage";

export interface UploadCoverImageRequest {
  fileName: string;
  imageContent: string; // Base64 encoded image content
}

export interface UploadCoverImageResponse {
  imageUrl: string;
}

// Uploads a cover image to product assets storage and returns the public URL.
export const uploadCoverImage = api<
  UploadCoverImageRequest,
  UploadCoverImageResponse
>(
  {
    expose: true,
    method: "POST",
    path: "/store/upload/cover",
    bodyLimit: null,
  },
  async (req) => {
    if (!req.fileName || !req.imageContent) {
      throw APIError.invalidArgument("fileName and imageContent are required");
    }

    // Validate it's an image file
    const ext = req.fileName.toLowerCase().split(".").pop();
    const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

    if (!ext || !allowedExtensions.includes(ext)) {
      throw APIError.invalidArgument(
        "only image files are allowed for cover images"
      );
    }

    try {
      // Decode base64 content
      const imageBuffer = Buffer.from(req.imageContent, "base64");

      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const uniqueFileName = `cover_${timestamp}_${req.fileName}`;

      // Upload to public storage bucket
      await productAssets.upload(uniqueFileName, imageBuffer, {
        contentType: getImageContentType(ext),
      });

      // Generate public URL
      const imageUrl = productAssets.publicUrl(uniqueFileName);

      return { imageUrl };
    } catch (error: any) {
      console.error("Cover image upload failed:", error);
      throw APIError.internal("failed to upload cover image");
    }
  }
);

function getImageContentType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };

  return mimeTypes[ext] || "image/jpeg";
}
