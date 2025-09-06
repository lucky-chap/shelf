import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Check, Image, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

interface UnsplashImage {
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

interface UnsplashImageSearchProps {
  selectedImageUrl?: string | null;
  onImageSelect: (imageUrl: string) => void;
}

function UnsplashImageSearchContent({ selectedImageUrl, onImageSelect }: UnsplashImageSearchProps) {
  const [searchQuery, setSearchQuery] = useState("nature landscape");
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const searchResults = useQuery({
    queryKey: ["unsplash", "search", searchQuery],
    queryFn: async () => {
      try {
        return await backend.config.searchUnsplash({ query: searchQuery });
      } catch (error: any) {
        console.error("Unsplash search failed:", error);
        throw error;
      }
    },
    enabled: hasSearched && searchQuery.trim().length > 0,
    retry: 1,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search term to find images.",
        variant: "destructive",
      });
      return;
    }
    setHasSearched(true);
  };

  const handleImageSelect = (image: UnsplashImage) => {
    onImageSelect(image.urls.regular);
    toast({
      title: "Background Selected",
      description: `Selected image by ${image.user.name}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Unsplash Background Images
        </CardTitle>
        <CardDescription>
          Search and select professional background images from Unsplash
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search for backgrounds (e.g., nature, abstract, city)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </form>

        {searchResults.isLoading && (
          <div className="text-center py-8">
            <LoadingSpinner text="Searching Unsplash..." />
          </div>
        )}

        {searchResults.isError && (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Failed to search Unsplash</p>
            <p className="text-sm text-destructive">
              {searchResults.error instanceof Error ? searchResults.error.message : "An unexpected error occurred"}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => searchResults.refetch()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {searchResults.data && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {searchResults.data.total.toLocaleString()} images
              </p>
              {selectedImageUrl && (
                <Badge variant="secondary">Background Selected</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResults.data.results.map((image: UnsplashImage) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer"
                  onClick={() => handleImageSelect(image)}
                >
                  <div className="aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors">
                    <img
                      src={image.urls.small}
                      alt={image.description || "Unsplash image"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {selectedImageUrl === image.urls.regular && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="font-medium">by {image.user.name}</p>
                    {image.description && (
                      <p className="text-gray-300 truncate">{image.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {searchResults.data.results.length === 0 && (
              <div className="text-center py-8">
                <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No images found</p>
                <p className="text-sm text-muted-foreground">Try a different search term</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function UnsplashImageSearch({ selectedImageUrl, onImageSelect }: UnsplashImageSearchProps) {
  return (
    <ErrorBoundary>
      <UnsplashImageSearchContent 
        selectedImageUrl={selectedImageUrl} 
        onImageSelect={onImageSelect} 
      />
    </ErrorBoundary>
  );
}
