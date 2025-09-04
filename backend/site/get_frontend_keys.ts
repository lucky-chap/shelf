import { api } from "encore.dev/api";
import { stripePublishableKey } from "../store/config"

export interface GetPublishableKeyResponse {
  key: string;
}

// Expose a GET endpoint to fetch the key
export const getPublishableKey = api<void, GetPublishableKeyResponse>(
  { expose: true, method: "GET", path: "/stripe/publishable-key" },
  async () => {
    if (!stripePublishableKey) {
      throw new Error("Stripe publishable key is not configured");
    }
    return { key: stripePublishableKey };
  }
);
