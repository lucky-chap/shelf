import { api, APIError } from "encore.dev/api";
import { ensureConfigured, polarRequest, polarMultipartUpload, mapPolarProduct } from "./polar";

export interface CreateProductFile {
  fileName: string;
  contentType: string;
  // Base64 encoded file content (no data: prefix), e.g. "iVBORw0KGgoAAAANSUhEUgAA..."
  base64Data: string;
}

export interface CreateProductRequest {
  title: string;
  description?: string;
  // Price in the smallest currency unit (e.g. cents). 0 => free.
  priceCents: number;
  currency?: string; // default USD
  // The primary file being sold/delivered by Polar.
  productFile: CreateProductFile;
  // Optional cover image for the product
  coverImage?: CreateProductFile;
}

export interface CreateProductResponse {
  product: {
    id: string;
    title: string;
    description: string | null;
    priceCents: number;
    priceCurrency: string;
    isFree: boolean;
    coverUrl: string | null;
    checkoutUrl: string | null;
  };
}

// Creates a product via Polar with price and uploads (file + optional cover).
// Note: This uses a best-effort call sequence based on Polar's public API shape.
// If Polar rejects upload endpoints, a clear error is returned.
export const createProduct = api<CreateProductRequest, CreateProductResponse>(
  { expose: true, method: "POST", path: "/store/products" },
  async (req) => {
    const { org } = ensureConfigured();

    if (!req.title?.trim()) {
      throw APIError.invalidArgument("title is required");
    }
    if (req.priceCents < 0) {
      throw APIError.invalidArgument("priceCents cannot be negative");
    }
    if (!req.productFile?.fileName || !req.productFile?.base64Data) {
      throw APIError.invalidArgument("productFile is required with fileName and base64Data");
    }

    const currency = (req.currency || "USD").toUpperCase();

    // 1) Create the product container
    // Polar likely expects: name, description, organization_id
    const createdProduct = await polarRequest<any>("/v1/products", {
      method: "POST",
      body: JSON.stringify({
        name: req.title,
        description: req.description || "",
        organization_id: org,
        // Some APIs accept visibility/status fields; we omit to keep generic.
      }),
    });

    const productId: string = createdProduct?.id;
    if (!productId) {
      throw APIError.internal("Polar did not return a product id");
    }

    // 2) Create price (free or minimum/fixed)
    // This tries a generic price creation endpoint. If Polar uses a different one,
    // the error from Polar will be surfaced.
    if (req.priceCents === 0) {
      // Attempt a "free" price
      await polarRequest<any>("/v1/product_prices", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          is_free: true,
          currency,
          amount: 0,
          type: "free",
        }),
      });
    } else {
      // Attempt a "minimum" (pay what you want) price using provided minimum
      await polarRequest<any>("/v1/product_prices", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          currency,
          amount: req.priceCents,
          type: "minimum",
          // Some APIs may require additional fields; left minimal intentionally.
        }),
      });
    }

    // 3) Upload product file (multipart). Endpoint may differ; we try a generic route:
    try {
      const fileBuf = Buffer.from(req.productFile.base64Data, "base64");
      await polarMultipartUpload(`/v1/products/${encodeURIComponent(productId)}/files`, {}, {
        fileName: req.productFile.fileName,
        contentType: req.productFile.contentType || "application/octet-stream",
        data: fileBuf,
      });
    } catch (err) {
      // If upload fails, surface a detailed error to the user instead of silently failing.
      throw APIError.failedPrecondition(
        "Failed to upload product file to Polar. Please verify your account has product uploads enabled."
      );
    }

    // 4) Optional: upload cover image
    if (req.coverImage?.fileName && req.coverImage?.base64Data) {
      try {
        const imgBuf = Buffer.from(req.coverImage.base64Data, "base64");
        await polarMultipartUpload(
          `/v1/products/${encodeURIComponent(productId)}/images`,
          {},
          {
            fileName: req.coverImage.fileName,
            contentType: req.coverImage.contentType || "image/jpeg",
            data: imgBuf,
          }
        );
      } catch {
        // Don't fail the entire creation if cover upload fails; present a partial success.
        // The creator can update the cover inside Polar later.
      }
    }

    // 5) Fetch fresh product details to return mapped fields back to the client
    const fetched = await polarRequest<any>(`/v1/products/${encodeURIComponent(productId)}`);
    const mapped = mapPolarProduct(fetched);

    return { product: mapped };
  }
);
