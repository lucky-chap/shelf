import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generateVisitorId } from "../utils/analytics";
import backend from "~backend/client";

export default function LinksList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const linksQuery = useQuery({
    queryKey: ["links"],
    queryFn: async () => {
      return await backend.links.list();
    },
  });

  const clickMutation = useMutation({
    mutationFn: async (linkId: number) => {
      return await backend.links.click({ id: linkId });
    },
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
    onError: (error: any) => {
      console.error("Failed to track click:", error);
      toast({
        title: "Error",
        description: "Failed to track click",
        variant: "destructive",
      });
    },
  });

  const trackClickMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const visitorId = generateVisitorId();
      return await backend.analytics.trackLinkClick({ 
        linkId, 
        visitorId 
      });
    },
    onError: (error: any) => {
      console.error("Failed to track analytics:", error);
    },
  });

  const handleLinkClick = async (linkId: number) => {
    // Track analytics first
    trackClickMutation.mutate(linkId);
    
    // Then track the click and open the link
    clickMutation.mutate(linkId);
  };

  if (linksQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading links...</p>
        </CardContent>
      </Card>
    );
  }

  const links = linksQuery.data?.links || [];

  if (links.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Links
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {links.map((link) => (
            <Button
              key={link.id}
              variant="outline"
              className="w-full h-auto p-4 justify-between"
              style={{
                backgroundColor: link.backgroundColor,
                color: link.textColor,
                borderColor: link.backgroundColor,
              }}
              onClick={() => handleLinkClick(link.id)}
              disabled={clickMutation.isPending}
            >
              <div className="flex items-center gap-3">
                {link.iconUrl && (
                  <img src={link.iconUrl} alt="" className="h-6 w-6 rounded" />
                )}
                <div className="text-left">
                  <div className="font-medium">{link.title}</div>
                  {link.description && (
                    <div className="text-sm opacity-75">{link.description}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {link.clickCount}
                </Badge>
                <ExternalLink className="h-4 w-4" />
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
