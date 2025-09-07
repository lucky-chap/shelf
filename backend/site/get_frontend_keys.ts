import { api } from "encore.dev/api";
import {
  stripePublishableKey,
  unsplashAccessKey,
  stripeSecretKey,
} from "../store/config";

export interface GetFrontendKeysResponse {
  publishableKey: string;
  unsplashAccessKey: string;
  secretKey: string;
}

// Expose a GET endpoint to fetch the key
export const getFrontendKeys = api<void, GetFrontendKeysResponse>(
  { expose: true, method: "GET", path: "/stripe/publishable-key" },
  async () => {
    const publishableKey = stripePublishableKey();
    const unsplashAccessKeyValue = unsplashAccessKey();
    const secretKey = stripeSecretKey();

    if (!publishableKey || !unsplashAccessKeyValue || !secretKey) {
      throw new Error(
        "Unsplash access key or Stripe secret key is not configured"
      );
    }
    return {
      publishableKey,
      unsplashAccessKey: unsplashAccessKeyValue,
      secretKey,
    };
  }
);
