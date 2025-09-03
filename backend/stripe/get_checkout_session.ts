import { api, APIError } from "encore.dev/api";

/**
 * Reads a non-empty environment variable.
 */
function readEnv(name: string): string | null {
  const v = process.env[name];
  if (v && typeof v === "string" && v.trim().length > 0) {
    return v;
  }
  return null;
}

/**
 * Optional Encore secret fallback.
 */
function readEncoreSecret(name: "STRIPE_SECRET_KEY"): string | null {
  try {
    const { secret } = require("encore.dev/config") as typeof import("encore.dev/config");
    const s = secret(name);
    const val = s();
    return val && val.trim().length > 0 ? val : null;
  } catch {
    return null;
  }
}

export interface GetCheckoutSessionRequest {
  sessionId: string;
}

export interface GetCheckoutSessionResponse {
  status: string;
  productId: number | null;
  downloadUrl: string | null;
  customerEmail: string | null;
}

// Retrieves a Stripe checkout session and extract download information.
export const getCheckoutSession = api<GetCheckoutSessionRequest, GetCheckoutSessionResponse>(
  { expose: true, method: "GET", path: "/stripe/checkout-session/:sessionId" },
  async ({ sessionId }) => {
    const stripeSecretKey = readEnv("STRIPE_SECRET_KEY") || readEncoreSecret("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw APIError.failedPrecondition("Stripe secret key not configured (STRIPE_SECRET_KEY)");
    }

    try {
      // Import Stripe dynamically
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2023-10-16",
      });

      // Retrieve checkout session
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      let productId: number | null = null;
      let downloadUrl: string | null = null;

      if (session.metadata) {
        productId = session.metadata.productId ? parseInt(session.metadata.productId) : null;
        downloadUrl = session.metadata.downloadUrl || null;
      }

      return {
        status: session.payment_status || "unpaid",
        productId,
        downloadUrl,
        customerEmail: session.customer_details?.email || null,
      };
    } catch (error: any) {
      console.error("Failed to retrieve checkout session:", error);
      throw APIError.internal("failed to retrieve checkout session");
    }
  }
);
