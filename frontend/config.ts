// Environment configuration loaded from Vite environment variables.
// IMPORTANT: Do NOT put any secret keys (sk_...) here; secrets must only be set on the backend.
//
// This application REQUIRES Stripe and Unsplash configuration to run.

// Stripe publishable key (REQUIRED)
const envStripeKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

// Unsplash access key (REQUIRED)
const envUnsplashKey = (import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY as string | undefined;

// The Stripe publishable key to initialize Stripe.js on the frontend.
// Loaded from Vite env: VITE_STRIPE_PUBLISHABLE_KEY
export const STRIPE_PUBLISHABLE_KEY = envStripeKey || "";

// The Unsplash access key for image search.
// Loaded from Vite env: VITE_UNSPLASH_ACCESS_KEY
export const UNSPLASH_ACCESS_KEY = envUnsplashKey || "";

// Check if Stripe is configured
export const isStripeConfigured = () => {
  return typeof STRIPE_PUBLISHABLE_KEY === "string" && 
         STRIPE_PUBLISHABLE_KEY.trim().length > 0 && 
         STRIPE_PUBLISHABLE_KEY.startsWith('pk_');
};

// Check if Unsplash is configured
export const isUnsplashConfigured = () => {
  return typeof UNSPLASH_ACCESS_KEY === "string" && UNSPLASH_ACCESS_KEY.trim().length > 0;
};
