import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";

// Call your Encore backend endpoint
async function fetchPublishableKey() {
  const res = await backend.site.getFrontendKeys()
  if (!res) throw new Error("Failed to fetch Stripe publishable key");

  console.log("Keys from backend", res);

  if (!data.stripePublishableKey || typeof data.stripePublishableKey !== "string" || !data.stripePublishableKey.trim()) {
    return undefined;
  }

  return data.stripePublishableKey;
}

// React Query hook for fetching + caching the key
export function useStripeKey() {
  return useQuery({
    queryKey: ["stripe", "publishableKey"],
    queryFn: fetchPublishableKey,
    retry: 3,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000), // exponential backoff
    staleTime: 1000 * 60 * 5, // cache for 5 min
  });
}
