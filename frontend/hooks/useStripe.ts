import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";

// Call your Encore backend endpoint
async function fetchStripePublishableKey() {
  const res = await backend.site.getFrontendKeys();
  if (!res)
    throw new Error("Failed to fetch Stripe publishable key from backend");

  // console.log("publishable key in hook: ", res.publishableKey);

  // if (!res.publishableKey || typeof res.publishableKey !== "string" || !res.publishableKey.trim()) {
  // return undefined
  // }

  return res.publishableKey;
}

async function checkStripeSecretKey() {
  const res = await backend.site.getFrontendKeys();
  if (!res) throw new Error("Failed to fetch Stripe secret key from backend");

  // console.log("secret key in hook: ", res.secretKey);

  if (
    !res.secretKey ||
    typeof res.secretKey !== "string" ||
    !res.secretKey.trim()
  ) {
    return false;
  } else {
    return true;
  }
}

// React Query hook for fetching + caching the key
export function useStripePublishableKey() {
  return useQuery({
    queryKey: ["stripe", "publishableKey"],
    queryFn: fetchStripePublishableKey,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // exponential backoff
    staleTime: 1000 * 60 * 5, // cache for 5 min
  });
}

export function useStripeSecretKey() {
  return useQuery({
    queryKey: ["stripe", "secretKey"],
    queryFn: checkStripeSecretKey,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // exponential backoff
    staleTime: 1000 * 60 * 5, // cache for 5 min
  });
}
