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

// Utility to upload base64 content to Polar if their API supports uploads via
// a dedicated endpoint. This implementation attempts a generic multipart fallback.
// If unsupported, the backend returns a clear error. Kept separate for clarity.
export async function polarMultipartUpload(
  path: string,
  fields: Record<string, string>,
  file: { fileName: string; contentType: string; data: Buffer }
): Promise<any> {
  const { key } = ensureConfigured();

  // Construct multipart/form-data body manually (without external deps).
  const boundary = `----polarform${Math.random().toString(36).slice(2)}`;
  const lines: Buffer[] = [];

  // Append fields
  for (const [k, v] of Object.entries(fields)) {
    lines.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`
      )
    );
  }

  // Append file
  lines.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.fileName}"\r\nContent-Type: ${file.contentType}\r\n\r\n`
    )
  );
  lines.push(file.data);
  lines.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(lines);

  const resp = await fetch(`https://api.polar.sh${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Accept: "application/json",
    },
    body,
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
