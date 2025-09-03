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

      // Prefer regenerating a fresh signed URL using file_key if present
      const fileKey = session.metadata?.file_key;
      if (fileKey) {
        try {
          const fresh = await productFiles.signedDownloadUrl(fileKey, { ttl: 2 * 3600 });
          return { paid: true, downloadUrl: fresh.url };
        } catch (error: any) {
          console.error("Failed to generate fresh download URL:", error);
          // Fall back to stored URL if regeneration fails
        }
      }

      const dl = session.metadata?.download_url;
      if (!dl) {
        throw APIError.internal("download URL not present in session metadata");
      }
      
      return { paid: true, downloadUrl: dl };
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
