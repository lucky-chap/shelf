import Stripe from "stripe";

/**
 * Stripe environment variable resolution with validation.
 * Backend reads from process.env. As a convenience fallback, if the environment is
 * not set, we also try Encore secrets (if configured in the platform).
 */
type NonEmptyString = string & { __brand: "non-empty" };

/**
 * Reads a non-empty environment variable.
 */
function readEnv(name: string): NonEmptyString | null {
  const v = process.env[name];
  if (v && typeof v === "string" && v.trim().length > 0) {
    return v as NonEmptyString;
  }
  return null;
}

/**
 * Optionally reads Encore secrets if available at runtime.
 * We keep this as a fallback to support deployments configured via Encore Secrets.
 * If Encore's secret module is not available in your environment, this will be tree-shaken.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function readEncoreSecret(name: "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET"): string | null {
  try {
    // Dynamic import to avoid hard dependency if not used
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { secret } = require("encore.dev/config") as typeof import("encore.dev/config");
    const s = secret(name);
    const val = s();
    return val && val.trim().length > 0 ? val : null;
  } catch {
    return null;
  }
}

/**
 * Resolves and validates the Stripe Secret Key (sk_).
 * This is validated at call-time to avoid crashing at module load.
 */
export function getStripeSecretKey(): string {
  const fromEnv = readEnv("STRIPE_SECRET_KEY");
  const fromEncoreSecret = readEncoreSecret("STRIPE_SECRET_KEY");
  const value = (fromEnv || (fromEncoreSecret as any)) as string | null;

  if (!value) {
    const msg = "Missing STRIPE_SECRET_KEY. Please set it in your environment file.";
    console.error(msg);
    throw new Error(msg);
  }
  if (!value.startsWith("sk_")) {
    const msg = "Invalid STRIPE_SECRET_KEY. It must start with 'sk_'.";
    console.error(msg);
    throw new Error(msg);
  }
  return value;
}

/**
 * Resolves and validates the Stripe Webhook Secret (whsec_).
 * Returns null if not configured. Validated at call-time.
 */
export function getStripeWebhookSecret(): string | null {
  const fromEnv = readEnv("STRIPE_WEBHOOK_SECRET");
  const fromEncoreSecret = readEncoreSecret("STRIPE_WEBHOOK_SECRET");
  const value = (fromEnv || (fromEncoreSecret as any)) as string | null;

  if (!value) return null;
  if (!value.startsWith("whsec_")) {
    const msg = "Invalid STRIPE_WEBHOOK_SECRET. It must start with 'whsec_'.";
    console.error(msg);
    throw new Error(msg);
  }
  return value;
}

/**
 * Creates a new Stripe client using the validated secret key.
 */
export function newStripeClient(): Stripe {
  const key = getStripeSecretKey();
  return new Stripe(key, { apiVersion: "2024-06-20" });
}
