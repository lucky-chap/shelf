import { api, APIError } from "encore.dev/api";
import { avatarsBucket } from "./storage";
import crypto from "crypto";

export interface UploadAvatarResponse {
  url: string;
  filename: string;
}

// Uploads an avatar image and returns the public URL.
export const uploadAvatar = api<void, UploadAvatarResponse>(
  { expose: true, method: "POST", path: "/uploads/avatar" },
  async (_, { body }) => {
    if (!body || body.length === 0) {
      throw APIError.invalidArgument("no file provided");
    }

    // Generate a unique filename
    const fileId = crypto.randomUUID();
    const filename = `avatar-${fileId}.jpg`;

    try {
      // Upload the file to the avatars bucket
      await avatarsBucket.upload(filename, body, {
        contentType: "image/jpeg",
      });

      // Return the public URL
      const url = avatarsBucket.publicUrl(filename);

      return {
        url,
        filename,
      };
    } catch (error: any) {
      console.error("Failed to upload avatar:", error);
      throw APIError.internal("failed to upload avatar");
    }
  }
);
