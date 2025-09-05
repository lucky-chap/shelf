import { api, APIError } from "encore.dev/api";
import { productAssets } from "../store/storage";

export interface UploadAvatarRequest {
  fileName: string;
  imageContent: string; // Base64 encoded image content
}

export interface UploadAvatarResponse {
  avatarUrl: string;
}

// Uploads an avatar image to storage and returns the public URL.
export const uploadAvatar = api<UploadAvatarRequest, UploadAvatarResponse>(
  { expose: true, method: "POST", path: "/config/upload/avatar" },
  async (req) => {
    if (!req.fileName || !req.imageContent) {
      throw APIError.invalidArgument("fileName and imageContent are required");
    }

    // Validate it's an image file
    const ext = req.fileName.toLowerCase().split('.').pop();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!ext || !allowedExtensions.includes(ext)) {
      throw APIError.invalidArgument("only image files are allowed for avatars");
    }

    try {
      // Decode base64 content
      const imageBuffer = Buffer.from(req.imageContent, 'base64');
      
      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const uniqueFileName = `avatar_${timestamp}_${req.fileName}`;

      // Upload to public storage bucket
      await productAssets.upload(uniqueFileName, imageBuffer, {
        contentType: getImageContentType(ext)
      });

      // Generate public URL
      const avatarUrl = productAssets.publicUrl(uniqueFileName);

      return { avatarUrl };
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      throw APIError.internal("failed to upload avatar");
    }
  }
);

function getImageContentType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp"
  };

  return mimeTypes[ext] || "image/jpeg";
}
