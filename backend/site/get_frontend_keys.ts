import { api } from "encore.dev/api";
import { stripePublishableKey, unsplashAccessKey } from "../store/config";

export interface GetFrontendKeysResponse {
  publishableKey: string;
  unsplashAccessKey: string;
}

// Expose a GET endpoint to fetch the key
export const getFrontendKeys = api<void, GetFrontendKeysResponse>(
  { expose: true, method: "GET", path: "/stripe/publishable-key" },
  async () => {
    const publishableKey = stripePublishableKey();
    const unsplashAccessKeyValue = unsplashAccessKey();
    if (!publishableKey || !unsplashAccessKeyValue) {
      throw new Error(
        "Stripe publishable key or Unsplash access key is not configured"
      );
    }
    return { publishableKey, unsplashAccessKey: unsplashAccessKeyValue };
  }
);
