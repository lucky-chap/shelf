import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

interface PaymentFormProps {
  clientSecret: string;
  paymentIntentId: string;
  product: any;
  amount: number;
  onBack: () => void;
  onSuccess: () => void;
}

export default function PaymentForm({ 
  clientSecret, 
  paymentIntentId, 
  product, 
  amount, 
  onBack, 
  onSuccess 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment failed:", error);
        toast({
          title: "Payment Failed",
          description: error.message || "Your payment could not be processed.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded, get purchase details
        try {
          const purchaseResponse = await backend.payments.getPurchase({
            paymentIntentId: paymentIntent.id
          });
          
          setDownloadToken(purchaseResponse.purchase.downloadToken);
          setIsCompleted(true);
          
          toast({
            title: "Payment Successful!",
            description: "Your purchase is complete. You can now download your product.",
          });
        } catch (purchaseError: any) {
          console.error("Failed to get purchase details:", purchaseError);
          toast({
            title: "Payment Successful",
            description: "Your payment was processed, but there was an issue retrieving your download. Please contact support.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadToken) return;

    try {
      const response = await backend.purchases.download({ token: downloadToken });
      
      // Open download URL in new tab
      window.open(response.downloadUrl, "_blank");
      
      toast({
        title: "Download Started",
        description: `Remaining downloads: ${response.remainingDownloads}`,
      });
      
      // Close dialog after successful download
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (error: any) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  if (isCompleted) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold">Payment Successful!</h3>
          <p className="text-muted-foreground">
            Thank you for your purchase of {product.title}
          </p>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span>Amount Paid:</span>
            <span className="font-bold">${amount.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={handleDownload} className="w-full">
            Download Now
          </Button>
          <Button variant="outline" onClick={onSuccess} className="w-full">
            Close
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Download link will expire in 7 days. You have 5 download attempts.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">{product.title}</span>
          <span className="font-bold">${amount.toFixed(2)}</span>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span className="font-medium">Payment Details</span>
        </div>
        
        <PaymentElement />
      </div>

      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Your payment is secured by Stripe. We do not store your payment information.
      </p>
    </form>
  );
}
