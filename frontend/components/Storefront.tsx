import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Download, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import { getStripe } from "../utils/stripe";

interface PublicProduct {
  id: number;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  coverUrl: string | null;
}

function formatPrice(cents: number, currency: string) {
  const value = (cents / 100).toFixed(2);
  return `${currency.toUpperCase()} ${value}`;
}

export default function Storefront() {
  const { toast } = useToast();
  const [downloadingProductId, setDownloadingProductId] = useState<number | null>(null);
  const [redirectingProductId, setRedirectingProductId] = useState<number | null>(null);

  const productsQuery = useQuery({
    queryKey: ["store", "products"],
    queryFn: async () => {
      const res = await backend.store.listProducts();
      return res.products as PublicProduct[];
    },
  });

  const freeDownloadMutation = useMutation({
    mutationFn: async (productId: number) => {
      const { url } = await backend.store.freeDownload({ productId });
      return url;
    },
    onMutate: (pid) => setDownloadingProductId(pid),
    onSettled: () => setDownloadingProductId(null),
    onSuccess: (url) => {
      toast({ title: "Your download is ready" });
      window.open(url, "_blank");
    },
    onError: (err: any) => {
      console.error(err);
      toast({ title: "Download failed", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (productId: number) => {
      const successUrl = `${window.location.origin}/store/success`;
      const cancelUrl = window.location.href;
      const res = await backend.store.createCheckoutSession({ productId, successUrl, cancelUrl });
      return res;
    },
    onMutate: (pid) => setRedirectingProductId(pid),
    onSettled: () => setRedirectingProductId(null),
    onSuccess: async (data) => {
      if (data.freeDownloadUrl) {
        toast({ title: "Your download is ready" });
        window.open(data.freeDownloadUrl, "_blank");
        return;
      }
      if (data.sessionId) {
        const stripe = await getStripe();
        const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (result.error) {
          toast({ title: "Checkout error", description: result.error.message, variant: "destructive" });
        }
      }
    },
    onError: (err: any) => {
      console.error(err);
      toast({ title: "Checkout failed", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  if (productsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store</CardTitle>
          <CardDescription>Loading products...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
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
        <CardDescription>Support the creator by purchasing digital products</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 flex gap-4">
              <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden border bg-muted">
                {p.coverUrl ? (
                  <img src={p.coverUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Cover</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.title}</div>
                  <Badge variant="secondary">{p.priceCents === 0 ? "Free" : formatPrice(p.priceCents, p.currency)}</Badge>
                </div>
                {p.description && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</div>}
                <div className="mt-3">
                  {p.priceCents === 0 ? (
                    <Button
                      className="flex items-center gap-2"
                      onClick={() => freeDownloadMutation.mutate(p.id)}
                      disabled={downloadingProductId === p.id}
                    >
                      <Download className="h-4 w-4" />
                      {downloadingProductId === p.id ? "Preparing..." : "Download"}
                    </Button>
                  ) : (
                    <Button
                      className="flex items-center gap-2"
                      onClick={() => checkoutMutation.mutate(p.id)}
                      disabled={redirectingProductId === p.id}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {redirectingProductId === p.id ? "Redirecting..." : "Buy"}
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
