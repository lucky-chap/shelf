import { api, APIError } from "encore.dev/api";
import { purchasesDB } from "./db";
import crypto from "crypto";

export interface CreatePurchaseRequest {
  productId: number;
  buyerEmail: string;
  buyerName?: string;
  amountPaidCents: number;
  paymentProvider: string;
  paymentId: string;
}

export interface Purchase {
  id: number;
  productId: number;
  buyerEmail: string;
  buyerName: string | null;
  amountPaidCents: number;
  paymentProvider: string;
  paymentId: string;
  downloadToken: string;
  downloadExpiresAt: Date;
  downloadCount: number;
  maxDownloads: number;
  createdAt: Date;
}

// Creates a new purchase record after successful payment.
export const create = api<CreatePurchaseRequest, Purchase>(
  { expose: true, method: "POST", path: "/purchases" },
  async (req) => {
    // Generate a secure download token
    const downloadToken = crypto.randomBytes(32).toString('hex');
    
    // Downloads expire in 7 days
    const downloadExpiresAt = new Date();
    downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 7);

    const purchase = await purchasesDB.queryRow<Purchase>`
      INSERT INTO purchases (product_id, buyer_email, buyer_name, amount_paid_cents, payment_provider, payment_id, download_token, download_expires_at)
      VALUES (${req.productId}, ${req.buyerEmail}, ${req.buyerName || null}, ${req.amountPaidCents}, ${req.paymentProvider}, ${req.paymentId}, ${downloadToken}, ${downloadExpiresAt})
      RETURNING id, product_id as "productId", buyer_email as "buyerEmail", buyer_name as "buyerName", amount_paid_cents as "amountPaidCents", payment_provider as "paymentProvider", payment_id as "paymentId", download_token as "downloadToken", download_expires_at as "downloadExpiresAt", download_count as "downloadCount", max_downloads as "maxDownloads", created_at as "createdAt"
    `;

    if (!purchase) {
      throw APIError.internal("failed to create purchase");
    }

    // Update product purchase count
    await purchasesDB.exec`
      UPDATE products 
      SET purchase_count = purchase_count + 1, updated_at = NOW()
      WHERE id = ${req.productId}
    `;

    return purchase;
  }
);
