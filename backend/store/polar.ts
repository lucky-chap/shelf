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
    try {
      body = await resp.json();
    } catch {
      // ignore
    }
    const msg =
      body?.message ||
      body?.error ||
      `Polar API error ${resp.status} ${resp.statusText}`;
    // Prefer detailed errors if Polar returns them
    if (resp.status === 401) throw APIError.unauthenticated(msg);
    if (resp.status === 403) throw APIError.permissionDenied(msg);
    if (resp.status === 404) throw APIError.notFound(msg);
    if (resp.status === 429) throw APIError.resourceExhausted(msg);
    if (resp.status >= 400 && resp.status < 500)
      throw APIError.invalidArgument(msg);
    throw APIError.internal(msg);
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

  // Add regular fields
  for (const [k, v] of Object.entries(fields)) {
    formData.append(k, v);
  }

  // Add the file as a Blob
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
      errorText = j?.message || j?.error || errorText;
    } catch {}
    if (resp.status === 404) throw APIError.notFound(errorText);
    if (resp.status === 401) throw APIError.unauthenticated(errorText);
    if (resp.status === 403) throw APIError.permissionDenied(errorText);
    if (resp.status >= 400 && resp.status < 500)
      throw APIError.invalidArgument(errorText);
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
  image_url?: string | null;
  prices?: Array<{
    id: string;
    amount?: number | null;
    currency?: string | null;
    type?: string | null; // e.g. "fixed", "minimum", "free"
    is_free?: boolean | null;
    checkout_url?: string | null;
  }>;
  checkout_url?: string | null;
}

export interface PolarListProductsResponse {
  items?: PolarProduct[];
  data?: PolarProduct[];
  results?: PolarProduct[];
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
  const coverUrl = p.image_url || null;
  let priceCents = 0;
  let priceCurrency = "USD";
  let isFree = false;
  let checkoutUrl: string | null =
    p.checkout_url || p.prices?.find((pr) => pr?.checkout_url)?.checkout_url || null;

  if (Array.isArray(p.prices) && p.prices.length > 0) {
    // Prefer a fixed/minimum USD price if available
    const preferred =
      p.prices.find((pr) => pr?.currency?.toUpperCase() === "USD" && pr?.type === "fixed") ||
      p.prices.find((pr) => pr?.currency?.toUpperCase() === "USD") ||
      p.prices[0];

    if (preferred) {
      if (typeof preferred.amount === "number") priceCents = preferred.amount;
      if (preferred.currency) priceCurrency = preferred.currency.toUpperCase();
      if (preferred.is_free) isFree = true;
      checkoutUrl = checkoutUrl || preferred.checkout_url || null;
    }
  }

  if (priceCents === 0) isFree = true;

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
