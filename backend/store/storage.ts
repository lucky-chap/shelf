import { Bucket } from "encore.dev/storage/objects";

// Private bucket for product files (secure downloads via signed URLs only).
export const productFilesBucket = new Bucket("product-files");

// Public bucket for product cover images (browsable on the site).
export const productCoversBucket = new Bucket("product-covers", { public: true });
