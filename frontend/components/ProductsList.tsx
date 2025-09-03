import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Download, ImageOff } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { stripePublishableKey } from "../config";
import { useToast } from "@/components/ui/use-toast";
import DownloadDialog from "./dialogs/DownloadDialog";
import LoadingSpinner from "./LoadingSpinner";
import backend from "~backend/client";

interface Product {
  id: number;
  title: string;
  description: string | null;
  priceCents: number;
  coverUrl: string | null;
  isActive: boolean;
  createdAt: Date;
}

export default function ProductsList() {
  const { toast } = useToast();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const productsQuery = useQuery({
    queryKey: ["store", "products"],
    queryFn: async () => {
      return await backend.store.listProducts();
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async (product: Product) => {
      const successUrl = `${window.location.origin}/checkout/success`;
      const cancelUrl = window.location.href;
      return await backend.store.createCheckoutSession({
        productId: product.id,
        successUrl: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl
      });
    },
    onSuccess: async (resp, variables) => {
      if (resp.downloadUrl) {
        setSelectedProduct(variables);
        setDownloadUrl(resp.downloadUrl);
        setShowDialog(true);
        return;
      }
      const sessionId = resp.sessionId;
      if (!sessionId) {
        // Fallback to sessionUrl if provided
        if (resp.sessionUrl) {
          window.location.assign(resp.sessionUrl);
          return;
        }
        toast({
          title: "Checkout Error",
          description: "Unable to initiate Stripe Checkout.",
          variant: "destructive",
        });
        return;
      }

      // Redirect using Stripe.js
      if (!stripePublishableKey) {
        // fallback: direct to session url if available
        if (resp.sessionUrl) {
          window.location.assign(resp.sessionUrl);
          return;
        }
        toast({
          title: "Stripe Not Configured",
          description: "Publishable key missing. Set VITE_STRIPE_PUBLISHABLE_KEY.",
          variant: "destructive",
        });
        return;
      }
      const stripe = await loadStripe(stripePublishableKey);
      if (!stripe) {
        toast({
          title: "Stripe Load Failed",
          description: "Could not initialize Stripe.js",
          variant: "destructive",
        });
        return;
      }
      await stripe.redirectToCheckout({ sessionId });
    },
    onError: (error: any) => {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Error",
        description: error?.message || "Failed to start checkout",
        variant: "destructive",
      });
    },
  });

  const products = productsQuery.data?.products ?? [];
  const hasProducts = products.length > 0;

  if (productsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store</CardTitle>
          <CardDescription>Explore digital products</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSpinner text="Loading products..." />
        </CardContent>
      </Card>
    );
  }

  if (!hasProducts) return null;

  const formatPrice = (cents: number) =>
    cents === 0 ? "Free" : `$${(cents / 100).toFixed(2)}`;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Store
          </CardTitle>
          <CardDescription>Digital downloads and resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.id} className="border rounded-lg overflow-hidden flex">
                <div className="w-28 h-28 bg-muted flex items-center justify-center">
                  {p.coverUrl ? (
                    <img
                      src={p.coverUrl}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{p.title}</h3>
                      <Badge variant="secondary">{formatPrice(p.priceCents)}</Badge>
                    </div>
                    {p.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => checkoutMutation.mutate(p)}
                      disabled={checkoutMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {p.priceCents === 0 ? <Download className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                      {p.priceCents === 0 ? "Download" : "Buy"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DownloadDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={selectedProduct?.title || "Your download is ready"}
        downloadUrl={downloadUrl}
      />
    </>
  );
}
