import { Bucket } from "encore.dev/storage/objects";

export const avatarsBucket = new Bucket("avatars", {
  public: true,
});

export const productsBucket = new Bucket("products", {
  public: false,
});

export const previewsBucket = new Bucket("previews", {
  public: true,
});
