// Frontend environment configuration powered by Vite's import.meta.env.
// IMPORTANT: Do NOT put any secret keys in the frontend.
// Only keys prefixed with VITE_ are exposed to the browser.

// Unsplash access key (optional, enables Unsplash background features)
const envUnsplashKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

// Stripe publishable key (required for digital store checkout)
const envStripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Exported values for use in the app
export const UNSPLASH_ACCESS_KEY = envUnsplashKey;
export const STRIPE_PUBLISHABLE_KEY = envStripePublishableKey;

// Check if Unsplash is configured
export const isUnsplashConfigured = () => {
  return typeof UNSPLASH_ACCESS_KEY === "string" && UNSPLASH_ACCESS_KEY.trim().length > 0;
};

// Check if Stripe is configured
export const isStripeConfigured = () => {
  return typeof STRIPE_PUBLISHABLE_KEY === "string" && STRIPE_PUBLISHABLE_KEY.trim().length > 0;
};
