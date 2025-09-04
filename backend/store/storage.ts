import { Bucket } from "encore.dev/storage/objects";

// Bucket for storing product files and cover images
export const productFiles = new Bucket("product-files", {
  public: false, // Private bucket for security
  versioned: false
});

// Bucket for temporary uploads and cover images (can be public for cover images)
export const productAssets = new Bucket("product-assets", {
  public: true, // Public bucket for cover images
  versioned: false
});
