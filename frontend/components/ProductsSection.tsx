import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Download, DollarSign, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { isStripeConfigured } from "../config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import backend from "~backend/client";

export default function ProductsSection() {
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadData, setDownloadData] = useState<{
    url: string;
    fileName: string;
    expiresIn: number;
  } | null>(null);
  const { toast } = useToast();

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return await backend.store.listProducts();
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await backend.store.downloadProduct({ productId });
    },
    onSuccess: (data) => {
      setDownloadData(data);
      setDownloadDialogOpen(true);
    },
    onError: (error: any) => {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (productId: number) => {
      const successUrl = `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&product_id=${productId}`;
      const cancelUrl = window.location.href;
      
      return await backend.store.createCheckoutSession({
        productId,
        successUrl,
        cancelUrl
      });
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error: any) => {
      console.error("Checkout failed:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const handleProductAction = (product: any) => {
    if (product.priceCents === 0) {
      // Free download
      downloadMutation.mutate(product.id);
    } else {
      // Paid product - start checkout
      if (!isStripeConfigured()) {
        toast({
          title: "Payment Not Available",
          description: "Stripe is not configured for payments.",
          variant: "destructive",
        });
        return;
      }
      checkoutMutation.mutate(product.id);
    }
  };

  const handleDownloadClick = () => {
    if (downloadData) {
      window.open(downloadData.url, '_blank');
      toast({
        title: "Download Started",
        description: "Your download should begin shortly.",
      });
    }
  };

  if (productsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Digital Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading products...</p>
        </CardContent>
      </Card>
    );
  }

  const products = productsQuery.data?.products || [];

  if (products.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Digital Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {product.coverImageUrl && (
                      <div className="aspect-video overflow-hidden rounded-md">
                        <img
                          src={product.coverImageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
                        <Badge variant={product.priceCents === 0 ? "secondary" : "default"}>
                          {formatPrice(product.priceCents)}
                        </Badge>
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(product.fileSize)}</span>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {product.downloadCount} downloads
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      variant={product.priceCents === 0 ? "outline" : "default"}
                      onClick={() => handleProductAction(product)}
                      disabled={downloadMutation.isPending || checkoutMutation.isPending}
                    >
                      {(downloadMutation.isPending || checkoutMutation.isPending) ? (
                        <LoadingSpinner size="sm" />
                      ) : product.priceCents === 0 ? (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download Free
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Buy {formatPrice(product.priceCents)}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <a href="/store">View All Products</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Download Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Ready</DialogTitle>
            <DialogDescription>
              Your download link is ready. Click the button below to start downloading.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {downloadData && (
              <div className="text-center space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{downloadData.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Link expires in {Math.floor(downloadData.expiresIn / 60)} minutes
                  </p>
                </div>
                <Button onClick={handleDownloadClick} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Now
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
