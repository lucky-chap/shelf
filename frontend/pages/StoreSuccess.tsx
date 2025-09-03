import { useEffect, useState } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Home } from "lucide-react";
import backend from "~backend/client";

function useQueryParams() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function StoreSuccess() {
  const params = useQueryParams();
  const sessionId = params.get("session_id") || "";
  const [downloadReady, setDownloadReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function init() {
    try {
      if (!sessionId) {
        setError("Missing session_id");
        setLoading(false);
        return;
      }

      // Fetch session metadata (contains our download endpoint path)
      const session = await backend.store.getCheckoutSession({ sessionId });
      if (session.paymentStatus !== "paid") {
        setError("Payment not completed yet. Please refresh in a moment.");
        setLoading(false);
        return;
      }

      // Exchange session for a secure, short-lived download URL
      const { url } = await backend.store.downloadFromSession({ sessionId });
      setDownloadUrl(url);
      setDownloadReady(true);
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to verify purchase");
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Thank you for your purchase!</CardTitle>
            <CardDescription>Your download is ready below.</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {loading && <p className="text-muted-foreground">Verifying payment...</p>}
            {error && <p className="text-destructive">{error}</p>}
            {downloadReady && downloadUrl && (
              <Button asChild className="flex items-center gap-2">
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
            <div className="pt-4">
              <Button variant="outline" asChild className="flex items-center gap-2">
                <RouterLink to="/">
                  <Home className="h-4 w-4" />
                  Back to Home
                </RouterLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
