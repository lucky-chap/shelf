import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Home, Download } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import backend from "~backend/client";

export default function CheckoutResult() {
  const [search] = useSearchParams();
  const sessionId = search.get("session_id");
  const [state, setState] = useState<{ loading: boolean; paid: boolean; downloadUrl?: string; error?: string }>({
    loading: true,
    paid: false,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      if (!sessionId) {
        setState({ loading: false, paid: false, error: "Missing session_id" });
        return;
      }
      try {
        const resp = await backend.store.retrieveCheckoutSession({ sessionId });
        if (!active) return;
        setState({ loading: false, paid: resp.paid, downloadUrl: resp.downloadUrl });
      } catch (e: any) {
        console.error(e);
        if (!active) return;
        setState({ loading: false, paid: false, error: e?.message || "Failed to verify payment" });
      }
    })();
    return () => { active = false; };
  }, [sessionId]);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Confirming your payment..." />
      </div>
    );
  }

  if (!state.paid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Payment Not Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{state.error || "We couldn't verify your payment."}</p>
            <div className="flex gap-2">
              <Link to="/">
                <Button className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Thank you for your purchase!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Your download is ready.</p>
          <Button asChild disabled={!state.downloadUrl} className="flex items-center gap-2">
            <a href={state.downloadUrl || "#"} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              Download
            </a>
          </Button>
          <Link to="/">
            <Button variant="outline" className="mt-2 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
