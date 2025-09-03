import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CreditCard, ExternalLink } from "lucide-react";
import { isStripeConfigured } from "../config";
import { useQuery } from "@tanstack/react-query";
import backend from "~backend/client";

interface Props {
  children: React.ReactNode;
}

export default function ConfigGuard({ children }: Props) {
  const frontendConfigured = isStripeConfigured();

  const backendStatusQuery = useQuery({
    queryKey: ["stripe", "status"],
    queryFn: async () => {
      try {
        return await backend.stripe.status();
      } catch (e) {
        // If backend status can't be fetched, don't block the app; assume not configured.
        return { backendConfigured: false, secretKeyPresent: false, webhookSecretPresent: false, message: "Unavailable" };
      }
    },
    staleTime: 60_000,
  });

  const backendConfigured = backendStatusQuery.data?.backendConfigured ?? false;
  const stripeConfigured = frontendConfigured && backendConfigured;

  // If Stripe is not configured, show a warning but don't block the app
  if (!stripeConfigured) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Configuration Required
              </CardTitle>
              <CardDescription className="text-amber-700">
                The Digital Store requires Stripe configuration to process payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertTitle>Stripe Configuration Missing</AlertTitle>
                <AlertDescription>
                  To enable the Digital Store feature, add these environment variables to your <code>.env</code> file:
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• <code>VITE_STRIPE_PUBLISHABLE_KEY</code> (frontend)</li>
                    <li>• <code>STRIPE_SECRET_KEY</code> (backend)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-800">Current Status:</p>
                <div className="flex items-center gap-2">
                  <Badge variant={stripeConfigured ? "default" : "secondary"}>
                    Stripe: {stripeConfigured ? "Configured ✅" : "Not Configured"}
                  </Badge>
                </div>
              </div>

              <div className="text-sm text-amber-700">
                <p className="mb-2">
                  <strong>Note:</strong> The app will continue to work, but the Digital Store will be disabled until Stripe is configured.
                </p>
                <p>
                  Get your Stripe keys from the{" "}
                  <a
                    href="https://dashboard.stripe.com/test/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-900 underline"
                  >
                    Stripe Dashboard <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
