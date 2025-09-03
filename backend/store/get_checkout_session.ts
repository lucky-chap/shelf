import { api, APIError } from "encore.dev/api";
import { getStripe } from "./stripe";

export interface GetCheckoutSessionRequest {
  sessionId: string;
}

export interface GetCheckoutSessionResponse {
  productId?: number;
  paymentStatus?: string | null;
  downloadEndpoint?: string | null; // Backend endpoint to exchange for a signed download link
}

// Retrieves a Checkout Session from Stripe and returns metadata needed to download.
export const getCheckoutSession = api<GetCheckoutSessionRequest, GetCheckoutSessionResponse>(
  { expose: true, method: "GET", path: "/store/checkout/session/:sessionId" },
  async ({ sessionId }) => {
    const stripe = getStripe();
    if (!sessionId) {
      throw APIError.invalidArgument("sessionId is required");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      throw APIError.notFound("session not found");
    }

    const productIdStr = session.metadata?.product_id ?? null;
    const productId = productIdStr ? parseInt(productIdStr, 10) : undefined;
    const downloadEndpoint = session.metadata?.download_url ?? null;

    return {
      productId,
      paymentStatus: session.payment_status ?? null,
      downloadEndpoint,
    };
  }
);
