import { api, APIError } from "encore.dev/api";
import { getStripe } from "./stripe";
import { storeDB } from "./db";
import { productFilesBucket } from "./storage";

export interface DownloadFromSessionRequest {
  sessionId: string;
}

export interface DownloadFromSessionResponse {
  url: string; // short-lived signed download URL
}

// Generates a secure download URL for a purchased product using the Stripe session.
export const downloadFromSession = api<DownloadFromSessionRequest, DownloadFromSessionResponse>(
  { expose: true, method: "POST", path: "/store/download" },
  async ({ sessionId }) => {
    if (!sessionId) {
      throw APIError.invalidArgument("sessionId is required");
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      throw APIError.notFound("session not found");
    }

    if (session.payment_status !== "paid") {
      throw APIError.permissionDenied("payment not completed");
    }

    const productIdStr = session.metadata?.product_id;
    if (!productIdStr) {
      throw APIError.failedPrecondition("missing product metadata");
    }
    const productId = parseInt(productIdStr, 10);

    const product = await storeDB.queryRow<{ fileObjectName: string }>`
      SELECT file_object_name as "fileObjectName"
      FROM products
      WHERE id = ${productId}
    `;

    if (!product) {
      throw APIError.notFound("product not found");
    }

    const signed = await productFilesBucket.signedDownloadUrl(product.fileObjectName, { ttl: 600 });
    return { url: signed.url };
  }
);
