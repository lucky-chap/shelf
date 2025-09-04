import { APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

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

export async function polarRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { key } = ensureConfigured();
  const base = "https://api.polar.sh";
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  
  const resp = await fetch(url, { ...options, headers });
  
  if (!resp.ok) {
    let body: any = null;
    let errorMessage = `Polar API error ${resp.status} ${resp.statusText}`;
    
    try {
      body = await resp.json();
      console.error("Polar API error response:", body);
      
      // Extract more detailed error information
      if (body?.detail) {
        if (Array.isArray(body.detail)) {
          // Handle validation errors with field details
          const fieldErrors = body.detail.map((err: any) => {
            if (err.loc && err.msg) {
              return `${err.loc.join('.')}: ${err.msg}`;
            }
            return err.msg || JSON.stringify(err);
          }).join(', ');
          errorMessage = `Validation error: ${fieldErrors}`;
        } else if (typeof body.detail === 'string') {
          errorMessage = body.detail;
        }
      } else if (body?.message) {
        errorMessage = body.message;
      } else if (body?.error) {
        errorMessage = body.error;
      }
    } catch (parseError) {
      console.error("Failed to parse Polar error response:", parseError);
      // Use the default error message if we can't parse the response
    }
    
    // Map HTTP status codes to appropriate APIError types
    if (resp.status === 401) throw APIError.unauthenticated(errorMessage);
    if (resp.status === 403) throw APIError.permissionDenied(errorMessage);
    if (resp.status === 404) throw APIError.notFound(errorMessage);
    if (resp.status === 422) throw APIError.invalidArgument(errorMessage); // Validation errors
    if (resp.status === 429) throw APIError.resourceExhausted(errorMessage);
    if (resp.status >= 400 && resp.status < 500) throw APIError.invalidArgument(errorMessage);
    throw APIError.internal(errorMessage);
  }
  
  return (await resp.json()) as T;
}

// Improved multipart upload using proper FormData construction
export async function polarMultipartUpload(
  path: string,
  fields: Record<string, string>,
  file: { fileName: string; contentType: string; data: Buffer }
): Promise<any> {
  const { key } = ensureConfigured();

  // Create a proper FormData object
  const formData = new FormData();

  // Add regular fields first
  for (const [k, v] of Object.entries(fields)) {
    formData.append(k, v);
  }

  // Add the file as a Blob with proper name
  const blob = new Blob([file.data], { type: file.contentType });
  formData.append("file", blob, file.fileName);

  const resp = await fetch(`https://api.polar.sh${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      // Don't set Content-Type, let the browser set it with the boundary
    },
    body: formData,
  });

  if (!resp.ok) {
    let errorText = `${resp.status} ${resp.statusText}`;
    try {
      const j = await resp.json();
      console.error("Polar upload error response:", j);
      
      // Extract detailed error information
      if (j?.detail) {
        if (Array.isArray(j.detail)) {
          const fieldErrors = j.detail.map((err: any) => {
            if (err.loc && err.msg) {
              return `${err.loc.join('.')}: ${err.msg}`;
            }
            return err.msg || JSON.stringify(err);
          }).join(', ');
          errorText = `Upload validation error: ${fieldErrors}`;
        } else {
          errorText = j.detail;
        }
      } else if (j?.message) {
        errorText = j.message;
      } else if (j?.error) {
        errorText = j.error;
      }
    } catch (parseError) {
      console.error("Failed to parse upload error response:", parseError);
    }
    
    if (resp.status === 404) throw APIError.notFound(errorText);
    if (resp.status === 401) throw APIError.unauthenticated(errorText);
    if (resp.status === 403) throw APIError.permissionDenied(errorText);
    if (resp.status === 422) throw APIError.invalidArgument(errorText);
    if (resp.status >= 400 && resp.status < 500) throw APIError.invalidArgument(errorText);
    throw APIError.internal(errorText);
  }

  try {
    return await resp.json();
  } catch {
    return {};
  }
}

// Types mirroring the fields we use from Polar responses.
// Using loose typing to be resilient to Polar API shape changes.
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
    type?: string | null; // e.g. "one_time", "recurring"
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
    // Find the first image media item
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
    // Find the first active (non-archived) price
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

  // For now, we don't have direct checkout URLs from the product data
  // This would need to be generated separately if needed
  checkoutUrl = null;

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
