import { Bucket } from "encore.dev/storage/objects";

export const productFiles = new Bucket("product-files", {
  public: false,
  versioned: false,
});

export const productCovers = new Bucket("product-covers", {
  public: true,
  versioned: false,
});
