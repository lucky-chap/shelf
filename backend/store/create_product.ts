import { api, APIError } from "encore.dev/api";
import { ensureConfigured, mapPolarProduct, uploadFile, uploadMedia, createProduct, createBenefit, getProduct } from "./polar";

export interface CreateProductFile {
  fileName: string;
  contentType: string;
  // Base64 encoded file content (no data: prefix), e.g. "iVBORw0KGgoAAAANSUhEUgAA..."
  base64Data: string;
}

export interface CreateProductRequest {
  title?: string;
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
    // Ensure Polar is configured
    ensureConfigured();

    // Use "Untitled" as fallback if no title provided
    const productTitle = req.title && typeof req.title === 'string' && req.title.trim() 
      ? req.title.trim() 
      : "Untitled";

    // Validate required fields with more specific error messages
    // if (typeof req.priceCents !== 'number') {
    //   throw APIError.invalidArgument("priceCents must be a number");
    // }
    
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
    
    if (!req.productFile.fileName || typeof req.productFile.fileName !== 'string' || !req.productFile.fileName.trim()) {
      throw APIError.invalidArgument("productFile.fileName is required and must be a non-empty string");
    }
    
    if (!req.productFile.base64Data || typeof req.productFile.base64Data !== 'string' || !req.productFile.base64Data.trim()) {
      throw APIError.invalidArgument("productFile.base64Data is required and must be a non-empty string");
    }
    
    if (!req.productFile.contentType || typeof req.productFile.contentType !== 'string') {
      throw APIError.invalidArgument("productFile.contentType is required and must be a string");
    }

    // Validate optional cover image if provided
    if (req.coverImage) {
      if (typeof req.coverImage !== 'object') {
        throw APIError.invalidArgument("coverImage must be an object when provided");
      }
      
      if (!req.coverImage.fileName || typeof req.coverImage.fileName !== 'string' || !req.coverImage.fileName.trim()) {
        throw APIError.invalidArgument("coverImage.fileName is required and must be a non-empty string when coverImage is provided");
      }
      
      if (!req.coverImage.base64Data || typeof req.coverImage.base64Data !== 'string' || !req.coverImage.base64Data.trim()) {
        throw APIError.invalidArgument("coverImage.base64Data is required and must be a non-empty string when coverImage is provided");
      }
      
      if (!req.coverImage.contentType || typeof req.coverImage.contentType !== 'string') {
        throw APIError.invalidArgument("coverImage.contentType is required and must be a string when coverImage is provided");
      }
    }

    const currency = (req.currency || "USD").toLowerCase();

    // Validate currency - Polar seems to only accept 'usd' in lowercase
    if (currency !== 'usd') {
      throw APIError.invalidArgument("currency must be 'USD' (only USD is supported by Polar)");
    }

    // Validate description if provided
    if (req.description !== undefined && req.description !== null && (typeof req.description !== 'string')) {
      throw APIError.invalidArgument("description must be a string when provided");
    }

    // Validate base64 data format
    try {
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
        name: productTitle,
        isRecurring: false,
        isArchived: false,
        recurringInterval: null,
        prices: [],
      };

      // Only add description if it exists and is not empty
      if (req.description && typeof req.description === 'string' && req.description.trim()) {
        productPayload.description = req.description.trim();
      }

      // Create the prices array with proper structure based on Polar API requirements
      if (req.priceCents === 0) {
        // For free products, use ProductPriceFreeCreate structure
        productPayload.prices = [
          {
            type: "one_time",
            amountType: "free",
            isArchived: false
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
            amountType: "fixed",
            priceAmount: actualPriceCents,
            priceCurrency: currency,
            isArchived: false
          }
        ];
      }

      const createdProduct = await createProduct(productPayload);

      const productId: string = createdProduct.id;
      if (!productId) {
        throw APIError.internal("Polar did not return a product id");
      }

      // 2) Create benefit for downloadable files
      await createBenefit(productId, {
        type: "downloadables",
        description: "Digital download",
        isTaxApplicable: false,
      });

      // 3) Upload product file
      try {
        let cleanBase64 = req.productFile.base64Data.trim();
        if (cleanBase64.includes(',')) {
          cleanBase64 = cleanBase64.split(',')[1];
        }
        
        const fileBuf = Buffer.from(cleanBase64, "base64");
        
        await uploadFile(productId, {
          fileName: req.productFile.fileName.trim(),
          contentType: req.productFile.contentType || "application/octet-stream",
          data: fileBuf,
        });
      } catch (err: any) {
        console.error("Product file upload error:", err);
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
          let cleanBase64 = req.coverImage.base64Data.trim();
          if (cleanBase64.includes(',')) {
            cleanBase64 = cleanBase64.split(',')[1];
          }
          
          const imgBuf = Buffer.from(cleanBase64, "base64");
          
          await uploadMedia(productId, {
            fileName: req.coverImage.fileName.trim(),
            contentType: req.coverImage.contentType || "image/jpeg",
            data: imgBuf,
          });
        } catch (err) {
          console.error("Cover image upload error:", err);
          // Don't fail the entire creation if cover upload fails
        }
      }

      // 5) Fetch fresh product details to return mapped fields back to the client
      const fetched = await getProduct(productId);
      const mapped = mapPolarProduct(fetched);

      return { product: mapped };
    } catch (error: any) {
      console.error("Create product error:", error);
      
      // If it's already an APIError, re-throw it
      if (error.code) {
        throw error;
      }
      
      // Parse error responses
      if (error.message && error.message.includes("422")) {
        throw APIError.invalidArgument("Invalid request data sent to Polar. Please check all product information and try again.");
      }
      
      if (error.message && error.message.includes("401")) {
        throw APIError.unauthenticated("Invalid Polar API key");
      }
      
      if (error.message && error.message.includes("403")) {
        throw APIError.permissionDenied("Insufficient permissions for Polar API");
      }
      
      if (error.message && error.message.includes("404")) {
        throw APIError.notFound("Polar organization not found");
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
