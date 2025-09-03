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
    try {
      const sk = STRIPE_SECRET_KEY();
      if (!sk) {
        throw APIError.failedPrecondition("Stripe secret key not configured. Set STRIPE_SECRET_KEY in Infrastructure -> Secrets.");
      }
      if (!sk.startsWith("sk_")) {
        throw APIError.failedPrecondition("Invalid Stripe secret key configured. It must start with 'sk_'.");
      }

      const stripe = new Stripe(sk, { apiVersion: "2024-06-20" });

      let session;
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["payment_intent"],
        });
      } catch (stripeError: any) {
        console.error("Failed to retrieve Stripe session:", stripeError);
        throw APIError.notFound("Checkout session not found");
      }

      const paid = session.payment_status === "paid";

      if (!paid) {
        return { paid: false };
      }

      // Generate a fresh signed URL using the file_key from metadata
      const fileKey = session.metadata?.file_key;
      if (!fileKey) {
        throw APIError.internal("file key not present in session metadata");
      }

      try {
        const { url } = await productFiles.signedDownloadUrl(fileKey, { ttl: 2 * 3600 });
        return { paid: true, downloadUrl: url };
      } catch (error: any) {
        console.error("Failed to generate download URL:", error);
        throw APIError.internal("Failed to generate download URL");
      }
    } catch (error: any) {
      console.error("Retrieve checkout session error:", error);
      
      // Re-throw APIErrors as-is
      if (error.code) {
        throw error;
      }
      
      // Wrap other errors
      throw APIError.internal(`Failed to retrieve checkout session: ${error.message}`);
    }
  }
);
