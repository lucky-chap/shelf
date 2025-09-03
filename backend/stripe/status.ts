import { api } from "encore.dev/api";

/**
 * Reads a non-empty environment variable.
 */
function readEnv(name: string): string | null {
  const v = process.env[name];
  if (v && typeof v === "string" && v.trim().length > 0) {
    return v;
  }
  return null;
}

/**
 * Optional Encore secret fallback.
 */
function readEncoreSecret(name: "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET"): string | null {
  try {
    const { secret } = require("encore.dev/config") as typeof import("encore.dev/config");
    const s = secret(name);
    const val = s();
    return val && val.trim().length > 0 ? val : null;
  } catch {
    return null;
  }
}

export interface StripeStatus {
  // Whether the backend has the required secret key to enable paid checkout.
  backendConfigured: boolean;
  // Secrets presence detail
  secretKeyPresent: boolean;
  webhookSecretPresent: boolean;
  // Optional status message for display.
  message: string;
}

// Returns backend Stripe configuration status.
// This is used by the frontend admin panel to show whether the Digital Store is enabled.
export const status = api<void, StripeStatus>(
  { expose: true, method: "GET", path: "/stripe/status" },
  async () => {
    const secretKey = readEnv("STRIPE_SECRET_KEY") || readEncoreSecret("STRIPE_SECRET_KEY");
    const webhookSecret = readEnv("STRIPE_WEBHOOK_SECRET") || readEncoreSecret("STRIPE_WEBHOOK_SECRET");

    const backendConfigured = !!secretKey; // store enablement depends on secret key
    const message = backendConfigured
      ? "Stripe: Configured. Digital Store is enabled."
      : "Stripe not configured on backend. Digital Store is disabled.";

    return {
      backendConfigured,
      secretKeyPresent: !!secretKey,
      webhookSecretPresent: !!webhookSecret,
      message,
    };
  }
);
