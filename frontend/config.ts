// Stripe publishable key loaded from Vite environment.
// IMPORTANT: Do NOT put any secret keys (sk_...) here; secrets must only be set on the backend.
// This app will throw at startup if the publishable key is missing or invalid.
const envKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

if (!envKey || typeof envKey !== "string" || envKey.trim().length === 0) {
  throw new Error(
    "Missing VITE_STRIPE_PUBLISHABLE_KEY. Set a Stripe publishable key (starts with 'pk_') via a Vite environment variable."
  );
}
if (!/^pk_/.test(envKey)) {
  throw new Error(
    "Invalid VITE_STRIPE_PUBLISHABLE_KEY. The Stripe publishable key must start with 'pk_'."
  );
}

// The Stripe publishable key to initialize Stripe.js on the frontend.
// Loaded from Vite env: VITE_STRIPE_PUBLISHABLE_KEY
export const STRIPE_PUBLISHABLE_KEY = envKey;
