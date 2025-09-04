import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBoundary from "../components/ErrorBoundary";
import backend from "~backend/client";

function CheckoutSuccessPageContent() {
  const [searchParams] = useSearchParams();
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadData, setDownloadData] = useState<{
    url: string;
    fileName: string;
    expiresIn: number;
  } | null>(null);
  const { toast } = useToast();

  const sessionId = searchParams.get("session_id");
  const productId = searchParams.get("product_id");

  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!productId || !sessionId) {
        throw new Error("Missing required parameters");
      }
      return await backend.store.downloadProduct({ 
        productId: parseInt(productId), 
        sessionId 
      });
    },
    onSuccess: (data) => {
      setDownloadData(data);
      setDownloadDialogOpen(true);
    },
    onError: (error: any) => {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleDownloadClick = () => {
    if (downloadData) {
      window.open(downloadData.url, '_blank');
      toast({
        title: "Download Started",
        description: "Your download should begin shortly.",
      });
    }
  };

  const handleGetDownload = () => {
    downloadMutation.mutate();
  };

  // Auto-trigger download after a short delay
  useEffect(() => {
    if (sessionId && productId) {
      const timer = setTimeout(() => {
        downloadMutation.mutate();
      }, 2000); // 2 second delay to show success message

      return () => clearTimeout(timer);
    }
  }, [sessionId, productId]);

  if (!sessionId || !productId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Invalid checkout session</p>
              <Link to="/store">
                <Button variant="outline">
                  Return to Store
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Purchase Complete - Digital Store</title>
        <meta name="description" content="Your purchase was successful" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center space-x-4">
              <Link to="/store">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Store
                </Button>
              </Link>
            </div>

            {/* Success Message */}
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Purchase Successful!</CardTitle>
                <CardDescription>
                  Thank you for your purchase. Your download is being prepared.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Your payment has been processed successfully. You can download your product immediately.
                  </p>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Order Details</p>
                    <p className="text-sm text-muted-foreground">
                      Session ID: {sessionId.slice(0, 20)}...
                    </p>
                  </div>

                  <Button 
                    onClick={handleGetDownload}
                    disabled={downloadMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {downloadMutation.isPending ? (
                      <LoadingSpinner size="sm" text="Preparing download..." />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Get Download
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground">
                    <p>Need help? Contact support with your session ID.</p>
                    <p>Your download link will be valid for 1 hour.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
                <p className="text-xs text-muted-foreground">
                  Save this link if you need to download again later
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <ErrorBoundary>
      <CheckoutSuccessPageContent />
    </ErrorBoundary>
  );
}
