import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";

async function fetchUnsplashAccessKey() {
  const res = await backend.site.getFrontendKeys();
  if (!res) throw new Error("Failed to fetch Unsplash access key from backend");

  if (
    !res.unsplashAccessKey ||
    typeof res.unsplashAccessKey !== "string" ||
    !res.unsplashAccessKey.trim()
  ) {
    return false;
  } else {
    return true;
  }
}

export function useUnsplashAccessKey() {
  return useQuery({
    queryKey: ["unsplash", "accessKey"],
    queryFn: fetchUnsplashAccessKey,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // exponential backoff
    staleTime: 1000 * 60 * 5, // cache for 5 min
  });
}
