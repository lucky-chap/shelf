import { api, APIError } from "encore.dev/api";
import { productCoversBucket, productFilesBucket } from "./storage";
import crypto from "crypto";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export interface GetUploadUrlsRequest {
  // Main digital file
  fileName: string;
  fileContentType: string;

  // Optional cover image
  coverFileName?: string;
  coverContentType?: string;
}

export interface UploadTarget {
  url: string;       // Signed upload URL
  objectName: string; // Server-side generated object name
}

export interface GetUploadUrlsResponse {
  file: UploadTarget;
  cover?: UploadTarget;
}

// Generates signed upload URLs for product file and optional cover image.
export const getUploadUrls = api<GetUploadUrlsRequest, GetUploadUrlsResponse>(
  { expose: true, method: "POST", path: "/store/upload-urls" },
  async (req) => {
    if (!req.fileName || !req.fileContentType) {
      throw APIError.invalidArgument("fileName and fileContentType are required");
    }

    const id = crypto.randomUUID();
    const fileName = sanitizeFilename(req.fileName);
    const fileObjectName = `products/${id}/${fileName}`;

    const fileUpload = await productFilesBucket.signedUploadUrl(fileObjectName);

    let coverUpload: UploadTarget | undefined = undefined;
    if (req.coverFileName && req.coverContentType) {
      const coverName = sanitizeFilename(req.coverFileName);
      const coverObjectName = `covers/${id}/${coverName}`;
      const cover = await productCoversBucket.signedUploadUrl(coverObjectName);
      coverUpload = { url: cover.url, objectName: coverObjectName };
    }

    return {
      file: { url: fileUpload.url, objectName: fileObjectName },
      cover: coverUpload,
    };
  }
);
