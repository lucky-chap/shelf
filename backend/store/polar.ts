import { APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { Polar } from "@polar-sh/sdk";

const polarApiKeySecret = secret("PolarAPIKey");
const polarOrgIdSecret = secret("PolarOrganizationID");

function readEnv(name: string): string | null {
  const v = process.env[name];
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  return null;
}

export function getPolarApiKey(): string | null {
  const fromSecret = (polarApiKeySecret?.() || "").trim();
  if (fromSecret) return fromSecret;
  return readEnv("POLAR_API_KEY");
}

export function getPolarOrganizationId(): string | null {
  const fromSecret = (polarOrgIdSecret?.() || "").trim();
  if (fromSecret) return fromSecret;
  return readEnv("POLAR_ORGANIZATION_ID");
}

export function ensureConfigured() {
  const key = getPolarApiKey();
  const org = getPolarOrganizationId();
  if (!key || !org) {
    throw APIError.failedPrecondition(
      "Polar is not configured. Please set POLAR_API_KEY and POLAR_ORGANIZATION_ID."
    );
  }
  return { key, org };
}

// Initialize Polar SDK client
let polarClient: Polar | null = null;

export function getPolarClient(): Polar {
  const { key } = ensureConfigured();
  
  if (!polarClient) {
    polarClient = new Polar({
      accessToken: key,
    });
  }
  
  return polarClient;
}

// Types mirroring the fields we use from Polar responses.
export interface PolarProduct {
  id: string;
  name?: string;
  description?: string | null;
  media?: Array<{
    id: string;
    name: string;
    path: string;
    mime_type: string;
    size: number;
    public_url?: string;
  }>;
  prices?: Array<{
    id: string;
    price_amount?: number | null;
    price_currency?: string | null;
    type?: string | null;
    is_archived?: boolean;
  }>;
}

export interface PolarListProductsResponse {
  items?: PolarProduct[];
  data?: PolarProduct[];
  result?: PolarProduct[];
  pagination?: any;
}

export function mapPolarProduct(p: PolarProduct): {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  priceCurrency: string;
  isFree: boolean;
  coverUrl: string | null;
  checkoutUrl: string | null;
} {
  const title = p.name || "Untitled Product";
  const description = (p.description as string) || null;
  
  // Extract cover image from media
  let coverUrl: string | null = null;
  if (Array.isArray(p.media) && p.media.length > 0) {
    const imageMedia = p.media.find(media => 
      media.mime_type && media.mime_type.startsWith('image/')
    );
    if (imageMedia && imageMedia.public_url) {
      coverUrl = imageMedia.public_url;
    }
  }
  
  let priceCents = 0;
  let priceCurrency = "USD";
  let isFree = true;
  let checkoutUrl: string | null = null;

  if (Array.isArray(p.prices) && p.prices.length > 0) {
    const activePrice = p.prices.find(price => !price.is_archived) || p.prices[0];
    
    if (activePrice) {
      if (typeof activePrice.price_amount === "number") {
        priceCents = activePrice.price_amount;
        isFree = priceCents === 0;
      }
      if (activePrice.price_currency) {
        priceCurrency = activePrice.price_currency.toUpperCase();
      }
    }
  }

  return {
    id: p.id,
    title,
    description,
    priceCents,
    priceCurrency,
    isFree,
    coverUrl,
    checkoutUrl,
  };
}

// Helper function to upload files using the SDK
export async function uploadFile(
  productId: string,
  file: { fileName: string; contentType: string; data: Buffer }
): Promise<any> {
  const polar = getPolarClient();
  
  try {
    // Convert buffer to Blob for the SDK
    const blob = new Blob([file.data], { type: file.contentType });
    
    // Use the SDK's file upload method
    const result = await polar.products.files.create({
      id: productId,
      file: blob,
      filename: file.fileName,
    });
    
    return result;
  } catch (error: any) {
    console.error("Polar file upload failed:", error);
    
    if (error.statusCode === 404) throw APIError.notFound("Product not found");
    if (error.statusCode === 401) throw APIError.unauthenticated("Invalid Polar API key");
    if (error.statusCode === 403) throw APIError.permissionDenied("Insufficient permissions");
    if (error.statusCode === 422) throw APIError.invalidArgument("Invalid file or product data");
    if (error.statusCode >= 400 && error.statusCode < 500) throw APIError.invalidArgument(error.message || "Client error");
    
    throw APIError.internal(`File upload failed: ${error.message || 'Unknown error'}`);
  }
}

// Helper function to upload media using the SDK
export async function uploadMedia(
  productId: string,
  file: { fileName: string; contentType: string; data: Buffer }
): Promise<any> {
  const polar = getPolarClient();
  
  try {
    // Convert buffer to Blob for the SDK
    const blob = new Blob([file.data], { type: file.contentType });
    
    // Use the SDK's media upload method
    const result = await polar.products.media.create({
      id: productId,
      file: blob,
      filename: file.fileName,
    });
    
    return result;
  } catch (error: any) {
    console.error("Polar media upload failed:", error);
    
    if (error.statusCode === 404) throw APIError.notFound("Product not found");
    if (error.statusCode === 401) throw APIError.unauthenticated("Invalid Polar API key");
    if (error.statusCode === 403) throw APIError.permissionDenied("Insufficient permissions");
    if (error.statusCode === 422) throw APIError.invalidArgument("Invalid media or product data");
    if (error.statusCode >= 400 && error.statusCode < 500) throw APIError.invalidArgument(error.message || "Client error");
    
    throw APIError.internal(`Media upload failed: ${error.message || 'Unknown error'}`);
  }
}
