// Frontend environment configuration powered by Vite's import.meta.env.
// IMPORTANT: Do NOT put any secret keys in the frontend.
// Only keys prefixed with VITE_ are exposed to the browser.

// Unsplash access key (optional, enables Unsplash background features)
const envUnsplashKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

// Stripe publishable key (required for payments, safe to expose)
const envStripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Exported values for use in the app
export const UNSPLASH_ACCESS_KEY = envUnsplashKey;
export const STRIPE_PUBLISHABLE_KEY = envStripePublishableKey;

// Check if Unsplash is configured
export const isUnsplashConfigured = () => {
  return typeof UNSPLASH_ACCESS_KEY === "string" && UNSPLASH_ACCESS_KEY.trim().length > 0;
};

// Check if Stripe is configured (frontend-only check)
export const isStripeConfigured = () => {
  return typeof STRIPE_PUBLISHABLE_KEY === "string" && STRIPE_PUBLISHABLE_KEY.trim().length > 0;
};

// Startup check: log clear guidance if Stripe is not configured on the frontend.
(function logStripeFrontendStartupStatus() {
  if (!isStripeConfigured()) {
    // Match required console/admin message (do not crash the app).
    // The Digital Store requires Stripe configuration to process payments
    // Stripe Configuration Missing
    // To enable the Digital Store feature, add these environment variables to your .env file:
    // • VITE_STRIPE_PUBLISHABLE_KEY (frontend)
    // • STRIPE_SECRET_KEY (backend)
    // Current Status:
    // Stripe: Not Configured
    // Note: The app will continue to work, but the Digital Store will be disabled until Stripe is configured.
    // eslint-disable-next-line no-console
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
  } else {
    // eslint-disable-next-line no-console
    console.info("Stripe: Configured ✅ — Digital Store is enabled.");
  }
})();
