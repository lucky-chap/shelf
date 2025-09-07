import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Download,
  DollarSign,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LiveActiveUsersCounter from "../components/LiveActiveUsersCounter";
import ActiveUsersCounter from "../components/ActiveUsersCounter";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBoundary from "../components/ErrorBoundary";
import { trackPageView } from "../utils/analytics";
import backend from "~backend/client";
import { useStripeSecretKey } from "@/hooks/useStripe";

function ProductPageContent() {
  const { data: isStripeConfigured } = useStripeSecretKey();
  const { id } = useParams<{ id: string }>();
  const [email, setEmail] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadData, setDownloadData] = useState<{
    url: string;
    fileName: string;
    expiresIn: number;
  } | null>(null);
  const { toast } = useToast();

  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");
      try {
        return await backend.store.getProduct({ id: parseInt(id) });
      } catch (error: any) {
        console.error("Failed to fetch product:", error);
        throw error;
      }
    },
    enabled: !!id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Track page view when component mounts
  useEffect(() => {
    if (id) {
      trackPageView(`/product/${id}`);
    }
  }, [id]);

  const downloadMutation = useMutation({
    mutationFn: async ({
      productId,
      sessionId,
    }: {
      productId: number;
      sessionId?: string;
    }) => {
      return await backend.store.downloadProduct({ productId, sessionId });
    },
    onSuccess: (data) => {
      setDownloadData({
        url: data.downloadUrl,
        fileName: data.fileName,
        expiresIn: data.expiresIn,
      });
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
    mutationFn: async ({
      productId,
      customerEmail,
    }: {
      productId: number;
      customerEmail?: string;
    }) => {
      const successUrl = `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&product_id=${productId}`;
      const cancelUrl = window.location.href;

      return await backend.store.createCheckoutSession({
        productId,
        customerEmail,
        successUrl,
        cancelUrl,
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
      setIsCheckingOut(false);
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

  const handlePurchase = () => {
    if (!product) return;

    if (product.priceCents === 0) {
      // Free download
      downloadMutation.mutate({ productId: product.id });
    } else {
      // Paid product - start checkout
      if (!isStripeConfigured) {
        toast({
          title: "Payment Not Available",
          description: "Stripe is not configured for payments.",
          variant: "destructive",
        });
        return;
      }

      setIsCheckingOut(true);
      checkoutMutation.mutate({
        productId: product.id,
        customerEmail: email || undefined,
      });
    }
  };

  const handleDownloadClick = () => {
    if (downloadData) {
      window.open(downloadData.url, "_blank");
      toast({
        title: "Download Started",
        description: "Your download should begin shortly.",
      });
    }
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">Invalid product ID</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" text="Loading product..." />
          </div>
        </div>
      </div>
    );
  }

  if (productQuery.isError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Failed to load product
              </p>
              <p className="text-sm text-destructive mb-4">
                {productQuery.error instanceof Error
                  ? productQuery.error.message
                  : "An unexpected error occurred"}
              </p>
              <Button onClick={() => productQuery.refetch()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const product = productQuery.data;

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Product not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.title} - Digital Store</title>
        <meta
          name="description"
          content={product.description || `Download ${product.title}`}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/store">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Store
                  </Button>
                </Link>
              </div>
              <ErrorBoundary fallback={<ActiveUsersCounter />}>
                <LiveActiveUsersCounter page={`/product/${id}`} />
              </ErrorBoundary>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product Image */}
              <div className="space-y-4">
                {product.coverImageUrl ? (
                  <div className="aspect-video overflow-hidden rounded-lg border">
                    <img
                      src={product.coverImageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-muted rounded-lg border">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h1 className="text-3xl font-bold text-foreground">
                      {product.title}
                    </h1>
                    <Badge
                      variant={
                        product.priceCents === 0 ? "secondary" : "default"
                      }
                      className="text-lg px-3 py-1"
                    >
                      {formatPrice(product.priceCents)}
                    </Badge>
                  </div>
                  {product.description && (
                    <p className="text-muted-foreground text-lg">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* File Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">File Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Name:</span>
                      <span className="font-medium">{product.fileName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Size:</span>
                      <span className="font-medium">
                        {formatFileSize(product.fileSize)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Downloads:</span>
                      <span className="font-medium">
                        {product.downloadCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Purchase Form */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      {product.priceCents === 0 ? "Download" : "Purchase"}
                    </CardTitle>
                    <CardDescription>
                      {product.priceCents === 0
                        ? "This product is free to download"
                        : "Complete your purchase to get instant access"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {product.priceCents > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isCheckingOut}
                        />
                        <p className="text-xs text-muted-foreground">
                          We'll send your download link to this email address
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handlePurchase}
                      disabled={isCheckingOut || downloadMutation.isPending}
                    >
                      {isCheckingOut || downloadMutation.isPending ? (
                        <LoadingSpinner
                          size="sm"
                          text={
                            product.priceCents === 0
                              ? "Preparing download..."
                              : "Processing..."
                          }
                        />
                      ) : product.priceCents === 0 ? (
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

                    {product.priceCents > 0 && !isStripeConfigured && (
                      <div className="text-center p-4 bg-destructive/10 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
                        <p className="text-sm text-destructive">
                          Payment processing is not available at this time
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Ready</DialogTitle>
            <DialogDescription>
              Your download link is ready. Click the button below to start
              downloading.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {downloadData && (
              <div className="text-center space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{downloadData.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Link expires in {Math.floor(downloadData.expiresIn / 60)}{" "}
                    minutes
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

export default function ProductPage() {
  return (
    <ErrorBoundary>
      <ProductPageContent />
    </ErrorBoundary>
  );
}
