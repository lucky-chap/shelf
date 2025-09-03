import { Bucket } from "encore.dev/storage/objects";

// Public bucket for cover images
export const productCovers = new Bucket("product-covers", {
  public: true,
});

// Private bucket for product files (digital downloads)
export const productFiles = new Bucket("product-files", {
  public: false,
});
