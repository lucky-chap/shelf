import { api } from "encore.dev/api";
import { stripePublishableKey } from "../store/config"

export interface GetFrontendKeysResponse {
  stripePublishableKey: string;
}
 
// Expose a GET endpoint to fetch the key
export const getPublishableKey = api<void, GetFrontendKeysResponse>(
  { expose: true, method: "GET", path: "/stripe/publishable-key" },
  async () => {
    if (!stripePublishableKey) {
      throw new Error("Stripe publishable key is not configured");
    }
    return { stripePublishableKey: stripePublishableKey };
  }
);
