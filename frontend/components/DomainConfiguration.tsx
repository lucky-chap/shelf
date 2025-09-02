import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Check, X, AlertTriangle, Copy, ExternalLink, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

interface DomainConfigurationProps {
  currentDomain?: string | null;
  onDomainChange: (domain: string | null) => void;
}

function DomainConfigurationContent({ currentDomain, onDomainChange }: DomainConfigurationProps) {
  const [domain, setDomain] = useState(currentDomain || "");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async (domainToVerify: string) => {
      return await backend.config.verifyDomain({ domain: domainToVerify });
    },
    onSuccess: (result) => {
      setVerificationResult(result);
      if (result.isVerified) {
        toast({
          title: "Domain Verified!",
          description: "Your custom domain is properly configured.",
        });
        onDomainChange(domain);
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "DNS records are not properly configured.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Domain verification failed:", error);
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify domain configuration.",
        variant: "destructive",
      });
    },
  });

  const handleVerifyDomain = () => {
    if (!domain.trim()) {
      toast({
        title: "Domain Required",
        description: "Please enter a domain name to verify.",
        variant: "destructive",
      });
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain.trim())) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid domain name (e.g., example.com).",
        variant: "destructive",
      });
      return;
    }

    verifyMutation.mutate(domain.trim());
  };

  const handleRemoveDomain = () => {
    setDomain("");
    setVerificationResult(null);
    onDomainChange(null);
    toast({
      title: "Domain Removed",
      description: "Your site will use the default hosting domain.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "DNS record value copied to clipboard.",
    });
  };

  const defaultHostingDomain = "your-site.lp.dev"; // This would be dynamic based on your hosting

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Custom Domain Configuration
          </CardTitle>
          <CardDescription>
            Connect your own domain name to your landing page for a professional appearance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Custom Domain</Label>
              <div className="flex gap-2">
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={verifyMutation.isPending}
                />
                <Button
                  onClick={handleVerifyDomain}
                  disabled={verifyMutation.isPending || !domain.trim()}
                  className="flex items-center gap-2"
                >
                  {verifyMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Verify
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your domain without www (e.g., example.com)
              </p>
            </div>

            {currentDomain && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Current Domain</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>Your site is configured to use: <strong>{currentDomain}</strong></span>
                  <Button variant="outline" size="sm" onClick={handleRemoveDomain}>
                    Remove
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {verificationResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {verificationResult.isVerified ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">Domain Verified</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-600">Verification Failed</span>
                  </>
                )}
              </div>

              {!verificationResult.isVerified && verificationResult.dnsRecords && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>DNS Configuration Required</AlertTitle>
                  <AlertDescription>
                    Please configure the following DNS records with your domain provider:
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {verificationResult && !verificationResult.isVerified && verificationResult.dnsRecords && (
        <Card>
          <CardHeader>
            <CardTitle>DNS Configuration</CardTitle>
            <CardDescription>
              Add these DNS records to your domain provider's control panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="records" className="space-y-4">
              <TabsList>
                <TabsTrigger value="records">DNS Records</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
              </TabsList>

              <TabsContent value="records" className="space-y-4">
                {verificationResult.dnsRecords.map((record: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{record.type}</Badge>
                        <span className="font-medium">{record.name}</span>
                        {record.configured ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(record.value)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-muted p-3 rounded font-mono text-sm">
                      {record.value}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {record.type === "CNAME" && "This CNAME record points your domain to our hosting platform."}
                      {record.type === "TXT" && "This TXT record verifies domain ownership."}
                    </p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="instructions" className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <h4 className="font-semibold mb-3">Step-by-Step Setup Instructions</h4>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-primary pl-4">
                      <h5 className="font-medium">1. Access Your Domain Provider</h5>
                      <p className="text-sm text-muted-foreground">
                        Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and navigate to the DNS management section.
                      </p>
                    </div>

                    <div className="border-l-4 border-primary pl-4">
                      <h5 className="font-medium">2. Add DNS Records</h5>
                      <p className="text-sm text-muted-foreground">
                        Add each DNS record shown above exactly as specified. The record type, name, and value must match exactly.
                      </p>
                    </div>

                    <div className="border-l-4 border-primary pl-4">
                      <h5 className="font-medium">3. Wait for Propagation</h5>
                      <p className="text-sm text-muted-foreground">
                        DNS changes can take up to 48 hours to propagate worldwide, though most changes take effect within a few hours.
                      </p>
                    </div>

                    <div className="border-l-4 border-primary pl-4">
                      <h5 className="font-medium">4. Verify Configuration</h5>
                      <p className="text-sm text-muted-foreground">
                        Once you've added the records, click the "Verify" button above to check if everything is configured correctly.
                      </p>
                    </div>
                  </div>

                  <Alert className="mt-6">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Need Help?</AlertTitle>
                    <AlertDescription>
                      If you're having trouble configuring DNS records, check your domain provider's documentation or contact their support team.
                      Common providers have specific guides for adding CNAME and TXT records.
                    </AlertDescription>
                  </Alert>

                  <div className="mt-6 space-y-2">
                    <h5 className="font-medium">Popular Domain Provider Guides:</h5>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <a 
                          href="https://www.godaddy.com/help/add-a-cname-record-19236" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          GoDaddy DNS Setup <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                      <li>
                        <a 
                          href="https://www.namecheap.com/support/knowledgebase/article.aspx/9646/2237/how-to-create-a-cname-record-for-your-domain/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Namecheap DNS Setup <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                      <li>
                        <a 
                          href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Cloudflare DNS Setup <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>Your landing page accessibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Default URL</p>
                <p className="text-sm text-muted-foreground">{defaultHostingDomain}</p>
              </div>
              <Badge variant="secondary">Always Available</Badge>
            </div>

            {currentDomain && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Custom Domain</p>
                  <p className="text-sm text-muted-foreground">{currentDomain}</p>
                </div>
                <Badge variant={verificationResult?.isVerified ? "default" : "destructive"}>
                  {verificationResult?.isVerified ? "Active" : "Needs Setup"}
                </Badge>
              </div>
            )}
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>SSL Certificate</AlertTitle>
            <AlertDescription>
              SSL certificates are automatically provisioned for verified custom domains. 
              Your site will be accessible via HTTPS once DNS verification is complete.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DomainConfiguration({ currentDomain, onDomainChange }: DomainConfigurationProps) {
  return (
    <ErrorBoundary>
      <DomainConfigurationContent currentDomain={currentDomain} onDomainChange={onDomainChange} />
    </ErrorBoundary>
  );
}
