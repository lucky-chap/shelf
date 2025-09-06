import { api, APIError } from "encore.dev/api";
import { productFiles } from "./storage";

export interface UploadFileRequest {
  fileName: string;
  fileContent: string; // Base64 encoded file content
}

export interface UploadFileResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

// Uploads a file to product storage and returns the URL.
export const uploadFile = api<UploadFileRequest, UploadFileResponse>(
  {
    expose: true,
    method: "POST",
    path: "/store/upload/file",
    bodyLimit: null,
  },
  async (req) => {
    if (!req.fileName || !req.fileContent) {
      throw APIError.invalidArgument("fileName and fileContent are required");
    }

    // if (req.fileContent.length > 10 * 1024 * 1024) {
    //   throw APIError.invalidArgument("File size exceeds 10MB limit");
    // }

    try {
      // Decode base64 content
      const fileBuffer = Buffer.from(req.fileContent, "base64");

      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${req.fileName}`;

      // Upload to storage
      const attrs = await productFiles.upload(uniqueFileName, fileBuffer, {
        contentType: getContentType(req.fileName),
      });

      // Generate the file URL (this would be internal URL for private bucket)
      const fileUrl = `product-files/${uniqueFileName}`;

      return {
        fileUrl,
        fileName: req.fileName,
        fileSize: attrs.size,
      };
    } catch (error: any) {
      console.error("File upload failed:", error);
      throw APIError.internal("failed to upload file");
    }
  }
);

function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop();

  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    zip: "application/zip",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  return mimeTypes[ext || ""] || "application/octet-stream";
}
