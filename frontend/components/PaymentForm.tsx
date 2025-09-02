import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

interface PaymentFormProps {
  clientSecret: string;
  paymentIntentId: string;
  product: any;
  amount: number;
  onBack: () => void;
  onSuccess: (data: any) => void;
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
          
          onSuccess({
            product,
            downloadUrl: paymentIntent.metadata.downloadUrl,
            downloadToken: purchaseResponse.purchase.downloadToken,
            amount,
            isFree: false
          });
          
          toast({
            title: "Payment Successful!",
            description: "Your purchase is complete. You can now download your product.",
          });
        } catch (purchaseError: any) {
          console.error("Failed to get purchase details:", purchaseError);
          // Still show success if payment went through
          onSuccess({
            product,
            downloadUrl: paymentIntent.metadata.downloadUrl,
            amount,
            isFree: false
          });
          
          toast({
            title: "Payment Successful",
            description: "Your payment was processed successfully.",
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
