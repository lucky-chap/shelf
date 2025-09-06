import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingBag, Download, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import LiveActiveUsersCounter from "../components/LiveActiveUsersCounter";
import ActiveUsersCounter from "../components/ActiveUsersCounter";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBoundary from "../components/ErrorBoundary";
import { trackPageView } from "../utils/analytics";
import backend from "~backend/client";

function ProductStorePageContent() {
  const navigate = useNavigate();

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        return await backend.store.listProducts();
      } catch (error: any) {
        console.error("Failed to fetch products:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Track page view when component mounts
  useEffect(() => {
    trackPageView('/store');
  }, []);

  const formatPrice = (priceCents: number) => {
    if (priceCents === 0) return "Free";
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (productsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" text="Loading store..." />
          </div>
        </div>
      </div>
    );
  }

  if (productsQuery.isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Failed to load store</p>
              <p className="text-sm text-destructive mb-4">
                {productsQuery.error instanceof Error ? productsQuery.error.message : "An unexpected error occurred"}
              </p>
              <Button onClick={() => productsQuery.refetch()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const products = productsQuery.data?.products || [];

  return (
    <>
      <Helmet>
        <title>Digital Store</title>
        <meta name="description" content="Browse and purchase digital products" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <ShoppingBag className="h-8 w-8" />
                    Digital Store
                  </h1>
                  <p className="text-muted-foreground">
                    Download digital products and resources
                  </p>
                </div>
              </div>
              <ErrorBoundary fallback={<ActiveUsersCounter />}>
                <LiveActiveUsersCounter page="/store" />
              </ErrorBoundary>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No products available</p>
                  <p className="text-sm text-muted-foreground">
                    Check back later for new digital products
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div onClick={() => navigate(`/product/${product.id}`)}>
                      {product.coverImageUrl && (
                        <div className="aspect-video overflow-hidden rounded-t-lg">
                          <img
                            src={product.coverImageUrl}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                          <Badge variant={product.priceCents === 0 ? "secondary" : "default"}>
                            {formatPrice(product.priceCents)}
                          </Badge>
                        </div>
                        {product.description && (
                          <CardDescription className="line-clamp-2">
                            {product.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{formatFileSize(product.fileSize)}</span>
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {product.downloadCount}
                          </div>
                        </div>
                        <Button className="w-full" variant={product.priceCents === 0 ? "outline" : "default"}>
                          {product.priceCents === 0 ? (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download Free
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Purchase {formatPrice(product.priceCents)}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProductStorePage() {
  return (
    <ErrorBoundary>
      <ProductStorePageContent />
    </ErrorBoundary>
  );
}
