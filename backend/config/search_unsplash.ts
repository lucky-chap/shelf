import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { unsplashAccessKey } from "../store/config";

export interface SearchUnsplashParams {
  query: Query<string>;
  page?: Query<number>;
}

export interface UnsplashImage {
  id: string;
  description: string | null;
  urls: {
    small: string;
    regular: string;
    full: string;
  };
  user: {
    name: string;
    username: string;
  };
  color: string;
}

export interface SearchUnsplashResponse {
  results: UnsplashImage[];
  total: number;
  totalPages: number;
}

// Searches Unsplash for background images.
export const searchUnsplash = api<SearchUnsplashParams, SearchUnsplashResponse>(
  { expose: true, method: "GET", path: "/config/unsplash/search" },
  async ({ query, page = 1 }) => {
    const accessKey = unsplashAccessKey();
    if (!accessKey) {
      throw APIError.failedPrecondition(
        "Unsplash access key not configured for server (UNSPLASH_ACCESS_KEY)"
      );
    }

    if (!query || query.trim().length === 0) {
      throw APIError.invalidArgument("Search query is required");
    }

    try {
      const url = new URL("https://api.unsplash.com/search/photos");
      url.searchParams.set("query", query);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("per_page", "20");
      url.searchParams.set("orientation", "landscape");

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw APIError.unauthenticated("Invalid Unsplash access key");
        }
        if (response.status === 403) {
          throw APIError.permissionDenied("Unsplash API rate limit exceeded");
        }
        throw APIError.internal(`Unsplash API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        results: any[];
        total: number;
        total_pages: number;
      };

      return {
        results: data.results.map((photo: any) => ({
          id: photo.id,
          description: photo.description || photo.alt_description,
          urls: {
            small: photo.urls.small,
            regular: photo.urls.regular,
            full: photo.urls.full,
          },
          user: {
            name: photo.user.name,
            username: photo.user.username,
          },
          color: photo.color,
        })),
        total: data.total,
        totalPages: data.total_pages,
      };
    } catch (error: any) {
      if (error.code) {
        throw error; // Re-throw APIErrors
      }
      console.error("Unsplash search failed:", error);
      throw APIError.internal("Failed to search Unsplash images");
    }
  }
);
