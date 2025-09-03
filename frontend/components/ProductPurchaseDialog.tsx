import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Download, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "./LoadingSpinner";
import { STRIPE_PUBLISHABLE_KEY } from "../config";
import backend from "~backend/client";

interface Product {
  id: number;
  title: string;
  description: string;
  priceCents: number;
  coverUrl: string;
  downloadUrl: string;
}

interface ProductPurchaseDialogProps {
  product: Product;
  isFree: boolean;
  children: React.ReactNode;
}

export default function ProductPurchaseDialog({ product, isFree, children }: ProductPurchaseDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const { toast } = useToast();

  // Check for successful Stripe payment on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId && isOpen) {
      handleStripeSuccess(sessionId);
    }
  }, [isOpen]);

  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      const currentUrl = window.location.href.split('?')[0]; // Remove existing query params
      return await backend.stripe.createCheckoutSession({
        productId: product.id,
        successUrl: `${currentUrl}?success=true&product=${product.id}`,
        cancelUrl: currentUrl,
      });
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error: any) => {
      console.error("Failed to create checkout session:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Unable to create checkout session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await backend.stripe.getCheckoutSession({ sessionId });
    },
    onSuccess: (data) => {
      if (data.status === "paid" && data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
        setIsPurchased(true);
        toast({
          title: "Payment Successful!",
          description: "Your purchase is complete. You can now download your file.",
        });
      } else {
        toast({
          title: "Payment Pending",
          description: "Your payment is still being processed. Please try again in a moment.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Failed to verify payment:", error);
      toast({
        title: "Verification Failed",
        description: "Unable to verify your payment. Please contact support.",
        variant: "destructive",
      });
    },
  });

  const handleStripeSuccess = (sessionId: string) => {
    getSessionMutation.mutate(sessionId);
  };

  const handleFreeDownload = () => {
    setDownloadUrl(product.downloadUrl);
    setIsPurchased(true);
    toast({
      title: "Download Ready!",
      description: "Your free download is now available.",
    });
  };

  const handlePurchase = () => {
    if (isFree) {
      handleFreeDownload();
    } else {
      if (!STRIPE_PUBLISHABLE_KEY) {
        toast({
          title: "Configuration Error",
          description: "Stripe is not configured. Please contact the site administrator.",
          variant: "destructive",
        });
        return;
      }
      createCheckoutMutation.mutate();
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      toast({
        title: "Download Started",
        description: "Your file download should begin shortly.",
      });
    }
  };

  const formatPrice = (priceCents: number) => {
    if (priceCents === 0) return "Free";
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const resetDialog = () => {
    setDownloadUrl(null);
    setIsPurchased(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetDialog();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product.title}</DialogTitle>
          <DialogDescription>
            {isPurchased ? "Download your purchase" : product.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isPurchased ? (
            <>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={product.coverUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold mb-2">
                  {formatPrice(product.priceCents)}
                </div>
                <p className="text-muted-foreground text-sm">
                  {product.description}
                </p>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={createCheckoutMutation.isPending}
                className="w-full flex items-center gap-2"
              >
                {createCheckoutMutation.isPending ? (
                  <LoadingSpinner size="sm" text="Processing..." />
                ) : isFree ? (
                  <>
                    <Download className="h-4 w-4" />
                    Download Now
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Continue to Checkout
                  </>
                )}
              </Button>

              {!isFree && (
                <p className="text-xs text-muted-foreground text-center">
                  You will be redirected to Stripe for secure payment processing
                </p>
              )}
            </>
          ) : (
            <>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {isFree 
                    ? "Your free download is ready!" 
                    : "Payment successful! Your download is ready."
                  }
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-4">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={product.coverUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Thank you for your {isFree ? "interest" : "purchase"}!
                  </p>
                </div>

                <Button
                  onClick={handleDownload}
                  disabled={!downloadUrl}
                  className="w-full flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download File
                </Button>

                <p className="text-xs text-muted-foreground">
                  Save this download link - it will expire in 7 days
                </p>
              </div>
            </>
          )}

          {(getSessionMutation.isPending) && (
            <div className="text-center py-4">
              <LoadingSpinner text="Verifying payment..." />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
