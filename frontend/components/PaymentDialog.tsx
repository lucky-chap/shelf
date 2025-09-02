import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, AlertTriangle } from "lucide-react";
import PaymentForm from "./PaymentForm";
import PurchaseSuccessDialog from "./PurchaseSuccessDialog";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import { stripePublishableKey } from "../config";

// Only initialize Stripe if we have a valid publishable key
const stripePromise = stripePublishableKey && stripePublishableKey !== "pk_test_placeholder" 
  ? loadStripe(stripePublishableKey) 
  : null;

interface PaymentDialogProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentDialog({ product, isOpen, onClose }: PaymentDialogProps) {
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [formData, setFormData] = useState({
    buyerEmail: "",
    buyerName: ""
  });

  const { toast } = useToast();

  if (!product) return null;

  // Check if Stripe is properly configured (only needed for paid products)
  const isStripeConfigured = stripePromise !== null;
  const isFreeProduct = product.priceCents === 0;

  const handleNext = async () => {
    if (!isFreeProduct && !isStripeConfigured) {
      toast({
        title: "Payment Not Available",
        description: "Payment processing is not configured. Please contact the site administrator.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.buyerEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingIntent(true);

    try {
      const request: any = {
        productId: product.id,
        buyerEmail: formData.buyerEmail,
        buyerName: formData.buyerName || undefined,
      };

      const response = await backend.payments.createIntent(request);
      
      // Handle free products
      if (response.amount === 0 && response.downloadUrl) {
        setPurchaseData({
          product,
          downloadUrl: response.downloadUrl,
          amount: 0,
          isFree: true
        });
        setStep("success");
        return;
      }

      setClientSecret(response.clientSecret);
      setPaymentIntentId(response.paymentIntentId);
      setStep("payment");
    } catch (error: any) {
      console.error("Failed to create payment intent:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handleBack = () => {
    setStep("details");
    setClientSecret(null);
    setPaymentIntentId(null);
  };

  const handleClose = () => {
    setStep("details");
    setClientSecret(null);
    setPaymentIntentId(null);
    setPurchaseData(null);
    setFormData({ buyerEmail: "", buyerName: "" });
    onClose();
  };

  const handlePaymentSuccess = (data: any) => {
    setPurchaseData(data);
    setStep("success");
  };

  const finalAmount = product.priceCents / 100;

  return (
    <>
      <Dialog open={isOpen && step !== "success"} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {isFreeProduct ? "Get" : "Purchase"} {product.title}
            </DialogTitle>
            <DialogDescription>
              {isFreeProduct ? "Get instant access to your free download" : "Complete your purchase to get instant access"}
            </DialogDescription>
          </DialogHeader>

          {!isFreeProduct && !isStripeConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Payment Not Available</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Payment processing is not configured. Please contact the site administrator to enable purchases.
                </p>
              </div>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-medium">{product.title}</h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {product.description}
                  </p>
                )}
                <div className="text-lg font-bold mt-2">
                  {isFreeProduct ? "Free" : `$${(product.priceCents / 100).toFixed(2)}`}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.buyerEmail}
                    onChange={(e) => setFormData({ ...formData, buyerEmail: e.target.value })}
                    required
                    disabled={!isFreeProduct && !isStripeConfigured}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={formData.buyerName}
                    onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                    disabled={!isFreeProduct && !isStripeConfigured}
                  />
                </div>
              </div>

              <Button 
                onClick={handleNext} 
                className="w-full"
                disabled={isCreatingIntent || (!isFreeProduct && !isStripeConfigured)}
              >
                {isCreatingIntent ? "Preparing..." : isFreeProduct ? "Get Download" : `Continue to Payment - $${finalAmount.toFixed(2)}`}
              </Button>
            </div>
          )}

          {step === "payment" && clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                },
              }}
            >
              <PaymentForm
                clientSecret={clientSecret}
                paymentIntentId={paymentIntentId!}
                product={product}
                amount={finalAmount}
                onBack={handleBack}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      <PurchaseSuccessDialog
        isOpen={step === "success"}
        onClose={handleClose}
        purchaseData={purchaseData}
      />
    </>
  );
}
