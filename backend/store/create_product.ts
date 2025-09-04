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
export const createProduct = api<CreateProductRequest, CreateProductResponse>(
  { expose: true, method: "POST", path: "/store/products" },
  async (req) => {
    const { org } = ensureConfigured();

    // Validate required fields with more specific error messages
    if (!req.title || typeof req.title !== 'string') {
      throw APIError.invalidArgument("title is required and must be a string");
    }
    
    if (!req.title.trim()) {
      throw APIError.invalidArgument("title cannot be empty");
    }
    
    if (typeof req.priceCents !== 'number') {
      throw APIError.invalidArgument("priceCents must be a number");
    }
    
    if (req.priceCents < 0) {
      throw APIError.invalidArgument("priceCents cannot be negative");
    }
    
    if (!Number.isInteger(req.priceCents)) {
      throw APIError.invalidArgument("priceCents must be a whole number (integer)");
    }
    
    if (!req.productFile) {
      throw APIError.invalidArgument("productFile is required");
    }
    
    if (typeof req.productFile !== 'object') {
      throw APIError.invalidArgument("productFile must be an object");
    }
    
    if (!req.productFile.fileName || typeof req.productFile.fileName !== 'string') {
      throw APIError.invalidArgument("productFile.fileName is required and must be a string");
    }
    
    if (!req.productFile.fileName.trim()) {
      throw APIError.invalidArgument("productFile.fileName cannot be empty");
    }
    
    if (!req.productFile.base64Data || typeof req.productFile.base64Data !== 'string') {
      throw APIError.invalidArgument("productFile.base64Data is required and must be a string");
    }
    
     if (!req.productFile.base64Data.trim()) {
       throw APIError.invalidArgument("productFile.base64Data cannot be empty");
     }
    
    if (!req.productFile.contentType || typeof req.productFile.contentType !== 'string') {
      throw APIError.invalidArgument("productFile.contentType is required and must be a string");
    }

    // Validate optional cover image if provided
    if (req.coverImage) {
      if (typeof req.coverImage !== 'object') {
        throw APIError.invalidArgument("coverImage must be an object when provided");
      }
      
      if (!req.coverImage.fileName || typeof req.coverImage.fileName !== 'string') {
        throw APIError.invalidArgument("coverImage.fileName is required when coverImage is provided");
      }
      
      if (!req.coverImage.fileName.trim()) {
        throw APIError.invalidArgument("coverImage.fileName cannot be empty when coverImage is provided");
      }
      
      if (!req.coverImage.base64Data || typeof req.coverImage.base64Data !== 'string') {
        throw APIError.invalidArgument("coverImage.base64Data is required when coverImage is provided");
      }
      
      if (!req.coverImage.base64Data.trim()) {
        throw APIError.invalidArgument("coverImage.base64Data cannot be empty when coverImage is provided");
      }
      
      if (!req.coverImage.contentType || typeof req.coverImage.contentType !== 'string') {
        throw APIError.invalidArgument("coverImage.contentType is required when coverImage is provided");
      }
    }

    const currency = (req.currency || "USD").toLowerCase();

    // Validate currency - Polar seems to only accept 'usd' in lowercase
    if (currency !== 'usd') {
      throw APIError.invalidArgument("currency must be 'USD' (only USD is supported by Polar)");
    }

    // Validate description if provided
    if (req.description !== undefined && req.description !== null && typeof req.description !== 'string') {
      throw APIError.invalidArgument("description must be a string when provided");
    }

    // Validate base64 data format
    try {
      // Test if the base64 data is valid by attempting to create a buffer
      let cleanBase64 = req.productFile.base64Data.trim();
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }
      
      const testBuffer = Buffer.from(cleanBase64, "base64");
      if (testBuffer.length === 0) {
        throw APIError.invalidArgument("productFile.base64Data contains invalid or empty base64 data");
      }
    } catch (error) {
      throw APIError.invalidArgument("productFile.base64Data is not valid base64 format");
    }

    // Validate cover image base64 if provided
    if (req.coverImage && req.coverImage.base64Data) {
      try {
        let cleanBase64 = req.coverImage.base64Data.trim();
        if (cleanBase64.includes(',')) {
          cleanBase64 = cleanBase64.split(',')[1];
        }
        
        const testBuffer = Buffer.from(cleanBase64, "base64");
        if (testBuffer.length === 0) {
          throw APIError.invalidArgument("coverImage.base64Data contains invalid or empty base64 data");
        }
      } catch (error) {
        throw APIError.invalidArgument("coverImage.base64Data is not valid base64 format");
      }
    }

    try {
      // 1) Create the product container with properly structured prices array
      const productPayload: any = {
        name: req.title.trim(),
        // organization_id: org,
        is_recurring: false,
        is_archived: false,
        // Add required recurring_interval field (even though product is not recurring)
        recurring_interval: null,
      };

      // Only add description if it exists and is not empty
      if (req.description && req.description.trim()) {
        productPayload.description = req.description.trim();
      }

      // Create the prices array with proper structure based on Polar API requirements
      if (req.priceCents === 0) {
        // For free products, use ProductPriceFreeCreate structure
        productPayload.prices = [
          {
            type: "one_time",
            amount_type: "free", // This is required for free products
            is_archived: false
          }
        ];
      } else {
        // For paid products, ensure minimum price of $0.50 (50 cents) as required by Polar
        const minPriceCents = 50;
        const actualPriceCents = Math.max(req.priceCents, minPriceCents);
        
        if (req.priceCents < minPriceCents) {
          console.warn(`Price ${req.priceCents} cents is below Polar minimum of ${minPriceCents} cents, adjusting to minimum`);
        }

        productPayload.prices = [
          {
            type: "one_time",
            amount_type: "fixed", // This is required for fixed-price products
            price_amount: actualPriceCents,
            price_currency: currency, // Must be lowercase 'usd'
            is_archived: false
          }
        ];
      }

      const createdProduct = await polarRequest<any>("/v1/products", {
        method: "POST",
        body: JSON.stringify(productPayload),
      });

      const productId: string = createdProduct?.id;
      if (!productId) {
        throw APIError.internal("Polar did not return a product id");
      }

      // 2) Create benefit for downloadable files
      await polarRequest<any>("/v1/products/benefits", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          type: "downloadables",
          description: "Digital download",
          is_tax_applicable: false,
        }),
      });

      // 3) Upload product file using improved multipart upload
      try {
        // Process base64 data
        let cleanBase64 = req.productFile.base64Data.trim();
        if (cleanBase64.includes(',')) {
          // Remove data URL prefix if present
          cleanBase64 = cleanBase64.split(',')[1];
        }
        
        const fileBuf = Buffer.from(cleanBase64, "base64");
        
        await polarMultipartUpload(`/v1/products/${encodeURIComponent(productId)}/benefits/downloadables/files`, {
          product_id: productId,
        }, {
          fileName: req.productFile.fileName.trim(),
          contentType: req.productFile.contentType || "application/octet-stream",
          data: fileBuf,
        });
      } catch (err: any) {
        console.error("Product file upload error:", err);
        // If upload fails, surface a detailed error to the user instead of silently failing.
        if (err.code) {
          throw err; // Re-throw APIErrors
        }
        throw APIError.failedPrecondition(
          "Failed to upload product file to Polar. Please verify your account has product uploads enabled and the file is valid."
        );
      }

      // 4) Optional: upload cover image
      if (req.coverImage?.fileName && req.coverImage?.base64Data) {
        try {
          // Process base64 data
          let cleanBase64 = req.coverImage.base64Data.trim();
          if (cleanBase64.includes(',')) {
            // Remove data URL prefix if present
            cleanBase64 = cleanBase64.split(',')[1];
          }
          
          const imgBuf = Buffer.from(cleanBase64, "base64");
          
          // Upload media to product
          await polarMultipartUpload(
            `/v1/products/${encodeURIComponent(productId)}/media`,
            {
              product_id: productId,
            },
            {
              fileName: req.coverImage.fileName.trim(),
              contentType: req.coverImage.contentType || "image/jpeg",
              data: imgBuf,
            }
          );
        } catch (err) {
          console.error("Cover image upload error:", err);
          // Don't fail the entire creation if cover upload fails; present a partial success.
          // The creator can update the cover inside Polar later.
        }
      }

      // 5) Fetch fresh product details to return mapped fields back to the client
      const fetched = await polarRequest<any>(`/v1/products/${encodeURIComponent(productId)}`);
      const mapped = mapPolarProduct(fetched);

      return { product: mapped };
    } catch (error: any) {
      console.error("Create product error:", error);
      
      // If it's already an APIError, re-throw it
      if (error.code) {
        throw error;
      }
      
      // Parse Polar API error responses more carefully
      if (error.message && error.message.includes("RequestValidationError")) {
        throw APIError.invalidArgument("Invalid request data sent to Polar. Please check all product information and try again.");
      }
      
      // Check for price validation errors specifically
      if (error.message && (
        error.message.includes("price_amount") ||
        error.message.includes("amount_type") ||
        error.message.includes("price_currency")
      )) {
        throw APIError.invalidArgument("Price validation failed. Ensure the price is at least $0.50 USD or set to $0.00 for free products.");
      }
      
      // Otherwise, wrap it in a generic error
      throw APIError.internal(`Failed to create product: ${error.message || 'Unknown error'}`);
    }
  }
);
