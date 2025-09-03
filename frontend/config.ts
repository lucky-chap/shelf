// Frontend environment configuration powered by Vite's import.meta.env.
// IMPORTANT: Do NOT put any secret keys (sk_ or whsec_) in the frontend.
// Only keys prefixed with VITE_ are exposed to the browser.

// Stripe publishable key (REQUIRED, must start with pk_)
const envStripeKey = import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

// Unsplash access key (optional, enables Unsplash background features)
const envUnsplashKey = import.meta.env?.VITE_UNSPLASH_ACCESS_KEY as string | undefined;

// Exported values for use in the app
export const STRIPE_PUBLISHABLE_KEY = envStripeKey || "";
export const UNSPLASH_ACCESS_KEY = envUnsplashKey || "";

// Check if Stripe is configured
export const isStripeConfigured = () => {
  return typeof STRIPE_PUBLISHABLE_KEY === "string" &&
    STRIPE_PUBLISHABLE_KEY.trim().length > 0 &&
    STRIPE_PUBLISHABLE_KEY.startsWith("pk_");
};

// Check if Unsplash is configured
export const isUnsplashConfigured = () => {
  return typeof UNSPLASH_ACCESS_KEY === "string" && UNSPLASH_ACCESS_KEY.trim().length > 0;
};
