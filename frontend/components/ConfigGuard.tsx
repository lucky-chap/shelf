import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Info, ExternalLink } from "lucide-react";
import { isStripeConfigured, isUnsplashConfigured, STRIPE_PUBLISHABLE_KEY, UNSPLASH_ACCESS_KEY } from "../config";

interface Props {
  children: React.ReactNode;
}

export default function ConfigGuard({ children }: Props) {
  const stripeOK = isStripeConfigured();
  const unsplashOK = isUnsplashConfigured();

  if (stripeOK && unsplashOK) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Configuration Required
          </CardTitle>
          <CardDescription>
            Stripe and Unsplash must be configured before the app can run.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Missing or invalid settings</AlertTitle>
            <AlertDescription>
              Please set the required environment variables and backend secrets, then refresh the page.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">VITE_STRIPE_PUBLISHABLE_KEY</div>
                <div className="text-sm text-muted-foreground">
                  {STRIPE_PUBLISHABLE_KEY ? `Current: ${STRIPE_PUBLISHABLE_KEY.slice(0, 6)}...` : "Not set"}
                </div>
              </div>
              <Badge variant={stripeOK ? "default" : "destructive"}>
                {stripeOK ? "OK" : "Missing / invalid"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">VITE_UNSPLASH_ACCESS_KEY</div>
                <div className="text-sm text-muted-foreground">
                  {UNSPLASH_ACCESS_KEY ? `Current: ${UNSPLASH_ACCESS_KEY.slice(0, 6)}...` : "Not set"}
                </div>
              </div>
              <Badge variant={unsplashOK ? "default" : "destructive"}>
                {unsplashOK ? "OK" : "Missing"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Frontend (in .env):</p>
            <ul className="list-disc list-inside">
              <li>VITE_STRIPE_PUBLISHABLE_KEY (must start with pk_)</li>
              <li>VITE_UNSPLASH_ACCESS_KEY</li>
            </ul>
            <p className="mt-3">Backend (Infrastructure -&gt; Secrets):</p>
            <ul className="list-disc list-inside">
              <li>STRIPE_SECRET_KEY (must start with sk_)</li>
              <li>UNSPLASH_ACCESS_KEY (same as frontend Unsplash key)</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="default" onClick={() => window.location.reload()} className="flex items-center gap-2">
              Reload
            </Button>
            <a
              href="https://unsplash.com/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" className="flex items-center gap-2">
                Unsplash Keys
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
            <a
              href="https://dashboard.stripe.com/test/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" className="flex items-center gap-2">
                Stripe Keys
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
