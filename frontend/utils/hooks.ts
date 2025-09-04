import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";

// Call your Encore backend endpoint
async function fetchPublishableKey() {
  const res = await backend.site.getFrontendKeys();
  if (!res) throw new Error("Failed to fetch Stripe publishable key from backend");

	console.log("publishable key in hook: ", res);

  if (!res.stripePublishableKey || typeof res.stripePublishableKey !== "string" || !res.stripePublishableKey.trim()) {
		return {
		key: undefined,
		configured: false,
	};
    // throw new Error("Stripe publishable key is missing or invalid");
  }

  return {
		key: res.stripePublishableKey,
		configured: true,
	};
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
