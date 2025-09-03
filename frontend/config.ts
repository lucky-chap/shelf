// Frontend environment configuration powered by Vite's import.meta.env.
// IMPORTANT: Do NOT put any secret keys in the frontend.
// Only keys prefixed with VITE_ are exposed to the browser.

// Unsplash access key (optional, enables Unsplash background features)
const envUnsplashKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

// Exported values for use in the app
export const UNSPLASH_ACCESS_KEY = envUnsplashKey;

// Check if Unsplash is configured
export const isUnsplashConfigured = () => {
  return typeof UNSPLASH_ACCESS_KEY === "string" && UNSPLASH_ACCESS_KEY.trim().length > 0;
};
