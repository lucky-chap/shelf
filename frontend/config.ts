// Environment configuration loaded from Vite environment variables.
// IMPORTANT: Do NOT put any secret keys (sk_...) here; secrets must only be set on the backend.

// Stripe publishable key
const envStripeKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

if (!envStripeKey || typeof envStripeKey !== "string" || envStripeKey.trim().length === 0) {
  throw new Error(
    "Missing VITE_STRIPE_PUBLISHABLE_KEY. Set a Stripe publishable key (starts with 'pk_') via a Vite environment variable."
  );
}
if (!/^pk_/.test(envStripeKey)) {
  throw new Error(
    "Invalid VITE_STRIPE_PUBLISHABLE_KEY. The Stripe publishable key must start with 'pk_'."
  );
}

// Unsplash access key (optional)
const envUnsplashKey = (import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY as string | undefined;

// The Stripe publishable key to initialize Stripe.js on the frontend.
// Loaded from Vite env: VITE_STRIPE_PUBLISHABLE_KEY
export const STRIPE_PUBLISHABLE_KEY = envStripeKey;

// The Unsplash access key for image search (optional).
// Loaded from Vite env: VITE_UNSPLASH_ACCESS_KEY
export const UNSPLASH_ACCESS_KEY = envUnsplashKey || "";

// Check if Unsplash is configured
export const isUnsplashConfigured = () => {
  return typeof UNSPLASH_ACCESS_KEY === "string" && UNSPLASH_ACCESS_KEY.trim().length > 0;
};
