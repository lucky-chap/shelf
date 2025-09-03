import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Download } from "lucide-react";
import { isStripeConfigured } from "../config";
import ProductPurchaseDialog from "./ProductPurchaseDialog";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

function ProductsSectionContent() {
  const frontendConfigured = isStripeConfigured();

  const stripeStatusQuery = useQuery({
    queryKey: ["stripe", "status"],
    queryFn: async () => {
      try {
        return await backend.stripe.status();
      } catch {
        return { backendConfigured: false };
      }
    },
    staleTime: 60_000,
  });

  const backendConfigured = stripeStatusQuery.data?.backendConfigured ?? false;
  const storeEnabled = frontendConfigured && backendConfigured;

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        return await backend.products.list();
      } catch (error: any) {
        console.error("Failed to fetch products:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  if (productsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Digital Store
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading products...</p>
        </CardContent>
      </Card>
    );
  }

  if (productsQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Digital Store
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load products</p>
        </CardContent>
      </Card>
    );
  }

  const products = productsQuery.data?.products || [];

  if (products.length === 0) {
    return null; // Don't show section if no products
  }

  const formatPrice = (priceCents: number) => {
    if (priceCents === 0) return "Free";
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Digital Store
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-muted">
                <img
                  src={product.coverUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{product.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {product.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant={product.priceCents === 0 ? "secondary" : "default"}>
                    {formatPrice(product.priceCents)}
                  </Badge>
                  
                  {product.priceCents === 0 ? (
                    <ProductPurchaseDialog product={product} isFree={true}>
                      <Button size="sm" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </ProductPurchaseDialog>
                  ) : storeEnabled ? (
                    <ProductPurchaseDialog product={product} isFree={false}>
                      <Button size="sm" className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Buy Now
                      </Button>
                    </ProductPurchaseDialog>
                  ) : (
                    <Button size="sm" disabled>
                      Stripe Required
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductsSection() {
  return (
    <ErrorBoundary>
      <ProductsSectionContent />
    </ErrorBoundary>
  );
}
