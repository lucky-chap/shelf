import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, ArrowLeft, AlertCircle, Clock } from "lucide-react";
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
    downloadUrl: string;
    fileName: string;
    expiresIn: number;
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const { toast } = useToast();

  const sessionId = searchParams.get("session_id");
  const productId = searchParams.get("product_id");

  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!productId || !sessionId) {
        throw new Error("Missing required parameters");
      }
      
      console.log("Attempting download with session:", sessionId, "product:", productId);
      
      return await backend.store.downloadProduct({ 
        productId: parseInt(productId), 
        sessionId 
      });
    },
    onSuccess: (data) => {
      setDownloadData(data);
      setDownloadDialogOpen(true);
      setIsProcessing(false);
      toast({
        title: "Download Ready!",
        description: "Your purchase has been processed successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Download failed:", error);
      
      // If it's a permission error and we haven't retried too many times
      if (error.message?.includes("valid purchase required") && retryCount < 5) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        
        const delay = Math.min(2000 * nextRetry, 10000); // Progressive delay: 2s, 4s, 6s, 8s, 10s
        
        toast({
          title: "Processing Payment",
          description: `Your purchase is being processed. Retrying in ${delay / 1000} seconds... (${nextRetry}/5)`,
        });
        
        setTimeout(() => {
          downloadMutation.mutate();
        }, delay);
      } else {
        setIsProcessing(false);
        
        if (retryCount >= 5) {
          toast({
            title: "Payment Processing Delayed",
            description: "Your payment is taking longer than expected to process. Please wait a moment and try the download button.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Download Failed",
            description: error.message || "Please try again or contact support.",
            variant: "destructive",
          });
        }
      }
    },
  });

  const handleDownloadClick = () => {
    if (downloadData) {
      window.open(downloadData.downloadUrl, '_blank');
      toast({
        title: "Download Started",
        description: "Your download should begin shortly.",
      });
    }
  };

// 	const handleDownloadClick = () => {
// 	  if (downloadData) {
// 	    const link = document.createElement("a");
// 	    link.href = downloadData.downloadUrl;
// 	    link.setAttribute("download", downloadData.fileName);
// 	    document.body.appendChild(link);
// 	    link.click();
// 	    document.body.removeChild(link);
	
// 	    toast({
// 	      title: "Download Started",
// 	      description: "Your download should begin shortly.",
// 	    });
// 	  }
// };


  const handleGetDownload = () => {
    setRetryCount(0); // Reset retry count for manual attempts
    downloadMutation.mutate();
  };

  // Auto-trigger download after a delay to allow webhook processing
  useEffect(() => {
    if (sessionId && productId) {
      // Start with a 3-second delay for initial attempt
      const timer = setTimeout(() => {
        console.log("Auto-triggering download for session:", sessionId, "product:", productId);
        downloadMutation.mutate();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [sessionId, productId]);

  // Update processing state based on mutation status
  useEffect(() => {
    if (downloadMutation.isSuccess || (downloadMutation.isError && retryCount >= 5)) {
      setIsProcessing(false);
    }
  }, [downloadMutation.isSuccess, downloadMutation.isError, retryCount]);

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
                  {isProcessing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-blue-900">Processing your payment...</p>
                          <p className="text-xs text-blue-700">
                            This usually takes a few seconds. Please wait.
                          </p>
                        </div>
                      </div>
                      
                      {retryCount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Retry attempt {retryCount} of 5
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Your payment has been processed successfully.
                    </p>
                  )}
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Order Details</p>
                    <p className="text-sm text-muted-foreground">
                      Session ID: {sessionId.slice(0, 20)}...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Product ID: {productId}
                    </p>
                  </div>

                  <Button 
                    onClick={handleGetDownload}
                    disabled={downloadMutation.isPending}
                    className="w-full"
                    size="lg"
                    variant={downloadData ? "outline" : "default"}
                  >
                    {downloadMutation.isPending ? (
                      <LoadingSpinner size="sm" text="Preparing download..." />
                    ) : downloadData ? (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Again
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Get Download
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground space-y-1">
                    {isProcessing ? (
                      <>
                        <p>Please wait while we process your payment and prepare your download.</p>
                        <p>This process is automatic and may take up to 30 seconds.</p>
                      </>
                    ) : (
                      <>
                        <p>Your download link will be valid for 1 hour.</p>
                        <p>Need help? Contact support with your session ID.</p>
                      </>
                    )}
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
