import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import Stripe from "stripe";
import { productFiles } from "./buckets";

const STRIPE_SECRET_KEY = secret("STRIPE_SECRET_KEY");

export interface RetrieveCheckoutSessionRequest {
  sessionId: string;
}

export interface RetrieveCheckoutSessionResponse {
  paid: boolean;
  downloadUrl?: string;
}

// Retrieves a checkout session and returns the download URL if paid.
export const retrieveCheckoutSession = api<RetrieveCheckoutSessionRequest, RetrieveCheckoutSessionResponse>(
  { expose: true, method: "GET", path: "/store/checkout/session/:sessionId" },
  async ({ sessionId }) => {
    const sk = STRIPE_SECRET_KEY();
    if (!sk) {
      throw APIError.failedPrecondition("Stripe secret key not configured");
    }
    const stripe = new Stripe(sk, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const paid = session.payment_status === "paid";

    if (!paid) {
      return { paid: false };
    }

    // Prefer regenerating a fresh signed URL using file_key if present
    const fileKey = session.metadata?.file_key;
    if (fileKey) {
      const fresh = await productFiles.signedDownloadUrl(fileKey, { ttl: 2 * 3600 });
      return { paid: true, downloadUrl: fresh.url };
    }

    const dl = session.metadata?.download_url;
    if (!dl) {
      throw APIError.internal("download URL not present in session metadata");
    }
    return { paid: true, downloadUrl: dl };
  }
);
