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
  try {
    const fromSecret = (polarApiKeySecret?.() || "").trim();
    if (fromSecret) return fromSecret;
  } catch (error) {
    // Secret might not be configured, fall back to env
  }
  return readEnv("POLAR_API_KEY");
}

export function getPolarOrganizationId(): string | null {
  try {
    const fromSecret = (polarOrgIdSecret?.() || "").trim();
    if (fromSecret) return fromSecret;
  } catch (error) {
    // Secret might not be configured, fall back to env
  }
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
    try {
      polarClient = new Polar({
        accessToken: key,
      });
    } catch (error: any) {
      console.error("Failed to initialize Polar client:", error);
      throw APIError.internal(`Failed to initialize Polar client: ${error.message}`);
    }
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

// Helper function to create products via direct API calls if SDK fails
async function createProductDirectAPI(payload: any, accessToken: string): Promise<any> {
  const response = await fetch("https://api.polar.sh/v1/products/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Polar API error ${response.status}: ${errorText}`);
  }

  return await response.json();
}

// Helper function to upload files using direct API calls if SDK fails
async function uploadFileDirectAPI(
  productId: string,
  file: { fileName: string; contentType: string; data: Buffer },
  accessToken: string
): Promise<any> {
  const formData = new FormData();
  const blob = new Blob([file.data], { type: file.contentType });
  formData.append("file", blob, file.fileName);

  const response = await fetch(`https://api.polar.sh/v1/products/${productId}/files/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Polar file upload API error ${response.status}: ${errorText}`);
  }

  return await response.json();
}

// Helper function to upload media using direct API calls if SDK fails
async function uploadMediaDirectAPI(
  productId: string,
  file: { fileName: string; contentType: string; data: Buffer },
  accessToken: string
): Promise<any> {
  const formData = new FormData();
  const blob = new Blob([file.data], { type: file.contentType });
  formData.append("file", blob, file.fileName);

  const response = await fetch(`https://api.polar.sh/v1/products/${productId}/media/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Polar media upload API error ${response.status}: ${errorText}`);
  }

  return await response.json();
}

// Helper function to upload files using the SDK with fallback to direct API
export async function uploadFile(
  productId: string,
  file: { fileName: string; contentType: string; data: Buffer }
): Promise<any> {
  const { key } = ensureConfigured();
  
  try {
    const polar = getPolarClient();
    
    // Try SDK method first
    if (polar.products && polar.products.files && polar.products.files.create) {
      try {
        const blob = new Blob([file.data], { type: file.contentType });
        
        const result = await polar.products.files.create({
          id: productId,
          file: blob,
          filename: file.fileName,
        });
        
        return result;
      } catch (sdkError: any) {
        console.warn("SDK file upload failed, trying direct API:", sdkError);
        // Fall back to direct API call
        return await uploadFileDirectAPI(productId, file, key);
      }
    } else {
      // SDK doesn't have the expected structure, use direct API
      return await uploadFileDirectAPI(productId, file, key);
    }
  } catch (error: any) {
    console.error("Polar file upload failed:", error);
    
    if (error.message && error.message.includes("404")) throw APIError.notFound("Product not found");
    if (error.message && error.message.includes("401")) throw APIError.unauthenticated("Invalid Polar API key");
    if (error.message && error.message.includes("403")) throw APIError.permissionDenied("Insufficient permissions");
    if (error.message && error.message.includes("422")) throw APIError.invalidArgument("Invalid file or product data");
    
    throw APIError.internal(`File upload failed: ${error.message || 'Unknown error'}`);
  }
}

// Helper function to upload media using the SDK with fallback to direct API
export async function uploadMedia(
  productId: string,
  file: { fileName: string; contentType: string; data: Buffer }
): Promise<any> {
  const { key } = ensureConfigured();
  
  try {
    const polar = getPolarClient();
    
    // Try SDK method first
    if (polar.products && polar.products.media && polar.products.media.create) {
      try {
        const blob = new Blob([file.data], { type: file.contentType });
        
        const result = await polar.products.media.create({
          id: productId,
          file: blob,
          filename: file.fileName,
        });
        
        return result;
      } catch (sdkError: any) {
        console.warn("SDK media upload failed, trying direct API:", sdkError);
        // Fall back to direct API call
        return await uploadMediaDirectAPI(productId, file, key);
      }
    } else {
      // SDK doesn't have the expected structure, use direct API
      return await uploadMediaDirectAPI(productId, file, key);
    }
  } catch (error: any) {
    console.error("Polar media upload failed:", error);
    
    if (error.message && error.message.includes("404")) throw APIError.notFound("Product not found");
    if (error.message && error.message.includes("401")) throw APIError.unauthenticated("Invalid Polar API key");
    if (error.message && error.message.includes("403")) throw APIError.permissionDenied("Insufficient permissions");
    if (error.message && error.message.includes("422")) throw APIError.invalidArgument("Invalid media or product data");
    
    throw APIError.internal(`Media upload failed: ${error.message || 'Unknown error'}`);
  }
}

// Create product with SDK fallback to direct API
export async function createProduct(payload: any): Promise<any> {
  const { key } = ensureConfigured();
  
  try {
    const polar = getPolarClient();
    
    // Try SDK method first
    if (polar.products && polar.products.create) {
      try {
        return await polar.products.create(payload);
      } catch (sdkError: any) {
        console.warn("SDK product creation failed, trying direct API:", sdkError);
        // Fall back to direct API call
        return await createProductDirectAPI(payload, key);
      }
    } else {
      // SDK doesn't have the expected structure, use direct API
      return await createProductDirectAPI(payload, key);
    }
  } catch (error: any) {
    console.error("Polar product creation failed:", error);
    
    if (error.message && error.message.includes("401")) throw APIError.unauthenticated("Invalid Polar API key");
    if (error.message && error.message.includes("403")) throw APIError.permissionDenied("Insufficient permissions");
    if (error.message && error.message.includes("422")) throw APIError.invalidArgument("Invalid product data");
    
    throw APIError.internal(`Product creation failed: ${error.message || 'Unknown error'}`);
  }
}

// Create benefits with SDK fallback to direct API
export async function createBenefit(productId: string, benefitData: any): Promise<any> {
  const { key } = ensureConfigured();
  
  try {
    const polar = getPolarClient();
    
    // Try SDK method first
    if (polar.products && polar.products.benefits && polar.products.benefits.create) {
      try {
        return await polar.products.benefits.create({
          productId: productId,
          ...benefitData,
        });
      } catch (sdkError: any) {
        console.warn("SDK benefit creation failed, trying direct API:", sdkError);
        // Fall back to direct API call
        const response = await fetch(`https://api.polar.sh/v1/products/${productId}/benefits/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(benefitData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Polar benefit API error ${response.status}: ${errorText}`);
        }

        return await response.json();
      }
    } else {
      // SDK doesn't have the expected structure, use direct API
      const response = await fetch(`https://api.polar.sh/v1/products/${productId}/benefits/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(benefitData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Polar benefit API error ${response.status}: ${errorText}`);
      }

      return await response.json();
    }
  } catch (error: any) {
    console.error("Polar benefit creation failed:", error);
    
    if (error.message && error.message.includes("401")) throw APIError.unauthenticated("Invalid Polar API key");
    if (error.message && error.message.includes("403")) throw APIError.permissionDenied("Insufficient permissions");
    if (error.message && error.message.includes("422")) throw APIError.invalidArgument("Invalid benefit data");
    
    throw APIError.internal(`Benefit creation failed: ${error.message || 'Unknown error'}`);
  }
}

// Get product with SDK fallback to direct API
export async function getProduct(productId: string): Promise<any> {
  const { key } = ensureConfigured();
  
  try {
    const polar = getPolarClient();
    
    // Try SDK method first
    if (polar.products && polar.products.get) {
      try {
        return await polar.products.get({ id: productId });
      } catch (sdkError: any) {
        console.warn("SDK product get failed, trying direct API:", sdkError);
        // Fall back to direct API call
        const response = await fetch(`https://api.polar.sh/v1/products/${productId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${key}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Polar get product API error ${response.status}: ${errorText}`);
        }

        return await response.json();
      }
    } else {
      // SDK doesn't have the expected structure, use direct API
      const response = await fetch(`https://api.polar.sh/v1/products/${productId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${key}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Polar get product API error ${response.status}: ${errorText}`);
      }

      return await response.json();
    }
  } catch (error: any) {
    console.error("Polar get product failed:", error);
    
    if (error.message && error.message.includes("401")) throw APIError.unauthenticated("Invalid Polar API key");
    if (error.message && error.message.includes("403")) throw APIError.permissionDenied("Insufficient permissions");
    if (error.message && error.message.includes("404")) throw APIError.notFound("Product not found");
    
    throw APIError.internal(`Get product failed: ${error.message || 'Unknown error'}`);
  }
}
