import { api, APIError } from "encore.dev/api";
import { paymentsDB } from "./db";

export interface GetPurchaseParams {
  paymentIntentId: string;
}

export interface Purchase {
  id: number;
  productId: number;
  productTitle: string;
  buyerEmail: string;
  buyerName: string | null;
  amountPaidCents: number;
  downloadToken: string;
  downloadExpiresAt: Date;
  downloadCount: number;
  maxDownloads: number;
  createdAt: Date;
}

export interface GetPurchaseResponse {
  purchase: Purchase;
}

// Retrieves purchase details by payment intent ID.
export const getPurchase = api<GetPurchaseParams, GetPurchaseResponse>(
  { expose: true, method: "GET", path: "/payments/purchase/:paymentIntentId" },
  async ({ paymentIntentId }) => {
    const purchase = await paymentsDB.queryRow<Purchase>`
      SELECT 
        p.id,
        p.product_id as "productId",
        pr.title as "productTitle",
        p.buyer_email as "buyerEmail",
        p.buyer_name as "buyerName",
        p.amount_paid_cents as "amountPaidCents",
        p.download_token as "downloadToken",
        p.download_expires_at as "downloadExpiresAt",
        p.download_count as "downloadCount",
        p.max_downloads as "maxDownloads",
        p.created_at as "createdAt"
      FROM purchases p
      JOIN products pr ON p.product_id = pr.id
      WHERE p.payment_id = ${paymentIntentId}
    `;

    if (!purchase) {
      throw APIError.notFound("purchase not found");
    }

    return { purchase };
  }
);
