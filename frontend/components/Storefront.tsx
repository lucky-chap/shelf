import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

interface StoreProduct {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  priceCurrency: string;
  isFree: boolean;
  coverUrl: string | null;
  checkoutUrl: string | null;
}

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return "Free";
  try {
    const val = (cents || 0) / 100;
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(val);
  } catch {
    return `$${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function StorefrontContent() {
  const { toast } = useToast();

  const configQuery = useQuery({
    queryKey: ["store", "config"],
    queryFn: async () => await backend.store.isConfigured(),
    staleTime: 5 * 60 * 1000,
  });

  const productsQuery = useQuery({
    queryKey: ["store", "products"],
    queryFn: async () => {
      const res = await backend.store.listProducts();
      return res.products as StoreProduct[];
    },
    enabled: !!configQuery.data?.enabled,
    staleTime: 60 * 1000,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (product: StoreProduct) => {
      // Prefer the product's own checkout URL if present
      if (product.checkoutUrl) {
        return { url: product.checkoutUrl };
      }
      // Otherwise create a checkout session via backend
      const url = new URL(window.location.href);
      url.searchParams.set("purchase", "success");
      const successUrl = url.toString();
      url.searchParams.delete("purchase");
      const cancelUrl = url.toString();

      return await backend.store.createCheckoutUrl({
        productId: product.id,
        successUrl,
        cancelUrl,
      });
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      console.error("Failed to start checkout:", error);
      toast({
        title: "Checkout Error",
        description: error?.message || "Could not start checkout.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("purchase") === "success") {
      toast({
        title: "Purchase Complete",
        description: "Thanks for your purchase! Your download and receipt will be delivered by Polar.",
      });
      url.searchParams.delete("purchase");
      window.history.replaceState({}, "", url.toString());
    }
  }, [toast]);

  if (!configQuery.data?.enabled) {
    return null;
  }

  if (productsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Store
          </CardTitle>
          <CardDescription>Loading products...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Please wait</div>
        </CardContent>
      </Card>
    );
  }

  const products = productsQuery.data || [];

  if (products.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Store
        </CardTitle>
        <CardDescription>Browse digital products</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.id} className="border rounded-lg overflow-hidden bg-card">
              {p.coverUrl && (
                <img
                  src={p.coverUrl}
                  alt={p.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{p.title}</div>
                    {p.description && (
                      <div className="text-sm text-muted-foreground line-clamp-3">
                        {p.description}
                      </div>
                    )}
                  </div>
                  <Badge variant={p.isFree ? "secondary" : "outline"}>
                    {formatPrice(p.priceCents, p.priceCurrency)}
                  </Badge>
                </div>
                <Button
                  className="w-full"
                  onClick={() => checkoutMutation.mutate(p)}
                  disabled={checkoutMutation.isPending}
                >
                  {p.isFree ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Get for Free
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Buy
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Storefront() {
  return (
    <ErrorBoundary>
      <StorefrontContent />
    </ErrorBoundary>
  );
}
