// @ts-nochec

import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { productFiles } from "./storage";
import { stripeSecretKey } from "./config";

export interface DownloadProductRequest {
  productId: number;
  sessionId?: string; // Stripe session ID for paid products
}

export interface DownloadProductResponse {
  downloadUrl: string;
  fileName: string;
  expiresIn: number; // Expiration time in seconds
}

// Generates a secure download link for a product.
export const downloadProduct = api<
  DownloadProductRequest,
  DownloadProductResponse
>({ expose: true, method: "POST", path: "/store/download" }, async (req) => {
  // console.log("Download request received:", {
  //   productId: req.productId,
  //   sessionId: req.sessionId,
  // });

  // Get product details
  const product = await storeDB.queryRow<{
    id: number;
    title: string;
    priceCents: number;
    fileUrl: string;
    fileName: string;
    isActive: boolean;
  }>`
      SELECT id, title, price_cents as "priceCents", file_url as "fileUrl", file_name as "fileName", is_active as "isActive"
      FROM products 
      WHERE id = ${req.productId}
    `;

  if (!product) {
    throw APIError.notFound("product not found");
  }

  if (!product.isActive) {
    throw APIError.failedPrecondition("product is not available");
  }

  // console.log("Product found:", {
  //   id: product.id,
  //   title: product.title,
  //   price: product.priceCents,
  //   fileUrl: product.fileUrl,
  // });

  // For free products, allow immediate download
  if (product.priceCents === 0) {
    // console.log("Processing free product download");

    // Update download count
    await storeDB.exec`
        UPDATE products 
        SET download_count = download_count + 1 
        WHERE id = ${req.productId}
      `;
  } else {
    // For paid products, verify the purchase
    if (!req.sessionId) {
      throw APIError.invalidArgument("sessionId required for paid products");
    }

    console.log(
      "Checking purchase for session:",
      req.sessionId,
      "product:",
      req.productId
    );

    // First check if there's a valid purchase for this session and product
    let purchase = await storeDB.queryRow<{ id: number; createdAt: Date }>`
        SELECT id, purchase_date as "createdAt"
        FROM purchases 
        WHERE stripe_session_id = ${req.sessionId} 
          AND product_id = ${req.productId}
      `;

    console.log("Purchase found:", purchase);

    // If no purchase found, try to verify the session with Stripe directly
    if (!purchase) {
      console.log(
        "No purchase found, attempting to verify session with Stripe..."
      );

      const secretKey = stripeSecretKey().trim();

      if (!secretKey) {
        throw APIError.failedPrecondition("Stripe not configured");
      }

      try {
        // Import Stripe dynamically
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(secretKey, {
          apiVersion: "2025-08-27.basil",
        });

        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(req.sessionId);
        // console.log("Stripe session retrieved:", {
        //   id: session.id,
        //   payment_status: session.payment_status,
        //   status: session.status,
        //   metadata: session.metadata,
        // });

        // Check if the session is completed and paid
        if (
          session.payment_status === "paid" &&
          session.status === "complete"
        ) {
          const sessionProductId = parseInt(session.metadata?.productId || "0");

          if (sessionProductId === req.productId) {
            console.log(
              "Session is valid, creating missing purchase record..."
            );

            // Create the missing purchase record
            await storeDB.exec`
                INSERT INTO purchases (
                  product_id,
                  stripe_session_id,
                  stripe_payment_intent_id,
                  customer_email,
                  amount_paid_cents,
                  purchase_date,
                  download_count,
                  last_downloaded_at
                ) VALUES (
                  ${req.productId},
                  ${req.sessionId},
                  ${session.payment_intent || null},
                  ${
                    session.customer_details?.email ||
                    session.customer_email ||
                    null
                  },
                  ${session.amount_total || product.priceCents},
                  NOW(),
                  0,
                  NULL
                )
                ON CONFLICT (stripe_session_id, product_id) DO NOTHING
              `;

            // Try to fetch the purchase again
            purchase = await storeDB.queryRow<{ id: number; createdAt: Date }>`
                SELECT id, purchase_date as "createdAt"
                FROM purchases 
                WHERE stripe_session_id = ${req.sessionId} 
                  AND product_id = ${req.productId}
              `;

            console.log("Purchase created and verified:", purchase);
          } else {
            console.error(
              "Product ID mismatch. Session product:",
              sessionProductId,
              "Requested product:",
              req.productId
            );
            throw APIError.permissionDenied("invalid session for this product");
          }
        } else {
          console.error("Session not completed or not paid:", {
            payment_status: session.payment_status,
            status: session.status,
          });
          throw APIError.permissionDenied("payment not completed");
        }
      } catch (stripeError: any) {
        console.error("Error verifying Stripe session:", stripeError);

        if (stripeError.code === "resource_missing") {
          throw APIError.notFound("session not found");
        }

        // If it's already an APIError, re-throw it
        if (stripeError.code) {
          throw stripeError;
        }

        throw APIError.internal("failed to verify payment");
      }
    }

    // Final check - we should have a purchase now
    if (!purchase) {
      console.error("Still no purchase found after Stripe verification");
      throw APIError.permissionDenied("valid purchase required for download");
    }

    // Update download count for the purchase
    await storeDB.exec`
        UPDATE purchases 
        SET download_count = download_count + 1, last_downloaded_at = NOW()
        WHERE stripe_session_id = ${req.sessionId} AND product_id = ${req.productId}
      `;

    // Update product download count
    await storeDB.exec`
        UPDATE products 
        SET download_count = download_count + 1 
        WHERE id = ${req.productId}
      `;

    console.log(
      "Download authorized for session:",
      req.sessionId,
      "product:",
      req.productId
    );
  }

  try {
    // Extract filename from the stored file URL
    // The fileUrl is stored as "product-files/timestamp_filename"
    console.log("Original file URL:", product.fileUrl);

    let fileName = "";
    if (product.fileUrl.startsWith("product-files/")) {
      // Remove the prefix to get just the filename
      fileName = product.fileUrl.replace("product-files/", "");
    } else {
      // Fallback: take everything after the last slash
      const fileUrlParts = product.fileUrl.split("/");
      fileName = fileUrlParts[fileUrlParts.length - 1];
    }

    if (!fileName) {
      console.error(
        "Could not extract filename from file URL:",
        product.fileUrl
      );
      throw APIError.internal("invalid file URL format");
    }

    console.log("Extracted filename for signed URL:", fileName);

    // Generate a signed download URL (expires in 1 hour)
    const signedUrlResult = await productFiles.signedDownloadUrl(fileName, {
      ttl: 3600, // 1 hour
    });

    console.log("Signed URL generated successfully:", {
      url: signedUrlResult.url,
    });

    const response = {
      downloadUrl: signedUrlResult.url,
      fileName: product.fileName,
      expiresIn: 3600,
    };

    console.log("Returning download response:", response);
    return response;
  } catch (error: any) {
    console.error("Failed to generate download URL:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      fileUrl: product.fileUrl,
    });
    throw APIError.internal("failed to generate download link");
  }
});
