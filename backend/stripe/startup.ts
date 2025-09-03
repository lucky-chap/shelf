/**
 * Backend startup Stripe configuration check.
 * Logs a clear message if Stripe is not configured.
 * This does NOT crash the app; it only informs and the store stays disabled.
 */

function readEnv(name: string): string | null {
  const v = process.env[name];
  if (v && typeof v === "string" && v.trim().length > 0) return v;
  return null;
}

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

const secretKey = readEnv("STRIPE_SECRET_KEY") || readEncoreSecret("STRIPE_SECRET_KEY");
const webhookSecret = readEnv("STRIPE_WEBHOOK_SECRET") || readEncoreSecret("STRIPE_WEBHOOK_SECRET");

// Log a clear message if missing. Do not crash.
if (!secretKey) {
  // Match the admin panel/console guidance required by the specification.
  // NOTE: Backend cannot verify the frontend publishable key, so we still show the unified guidance.
  // The Digital Store requires Stripe configuration to process payments
  // Stripe Configuration Missing
  // To enable the Digital Store feature, add these environment variables to your .env file:
  // • VITE_STRIPE_PUBLISHABLE_KEY (frontend)
  // • STRIPE_SECRET_KEY (backend)
  // Current Status:
  // Stripe: Not Configured
  // Note: The app will continue to work, but the Digital Store will be disabled until Stripe is configured.
  console.warn(
    [
      "The Digital Store requires Stripe configuration to process payments",
      "Stripe Configuration Missing",
      "To enable the Digital Store feature, add these environment variables to your .env file:",
      "• VITE_STRIPE_PUBLISHABLE_KEY (frontend)",
      "• STRIPE_SECRET_KEY (backend)",
      "Current Status:",
      "Stripe: Not Configured",
      "Note: The app will continue to work, but the Digital Store will be disabled until Stripe is configured.",
    ].join("\n")
  );
}

// Optional: webhook secret guidance (does not block enabling the store)
if (!webhookSecret) {
  console.info(
    "Stripe webhooks are not configured (STRIPE_WEBHOOK_SECRET missing). Checkout still works, but webhooks will be disabled."
  );
}
