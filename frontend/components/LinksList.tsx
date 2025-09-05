import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generateVisitorId } from "../utils/analytics";
import backend from "~backend/client";

interface LinksListProps {
  isAdminView?: boolean;
}

export default function LinksList({ isAdminView = false }: LinksListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const linksQuery = useQuery({
    queryKey: ["links"],
    queryFn: async () => {
      return await backend.links.list();
    },
  });

  const configQuery = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      return await backend.config.get();
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
  const config = configQuery.data;
  const layoutType = config?.layoutType || "default";

  if (links.length === 0) {
    return null;
  }

  // Apply layout-specific rendering
  const renderLinks = () => {
    switch (layoutType) {
      case "grid":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 links-container">
            {links.map((link) => (
              <LinkButton key={link.id} link={link} onLinkClick={handleLinkClick} isLoading={clickMutation.isPending} isAdminView={isAdminView} />
            ))}
          </div>
        );
        
      case "timeline":
        return (
          <div className="space-y-4 links-container">
            {links.map((link, index) => (
              <div key={link.id} className="relative">
                {index > 0 && (
                  <div className="absolute left-2 -top-4 w-px h-4 bg-border" />
                )}
                <LinkButton link={link} onLinkClick={handleLinkClick} isLoading={clickMutation.isPending} isAdminView={isAdminView} />
              </div>
            ))}
          </div>
        );
        
      case "minimal":
        return (
          <div className="space-y-2 links-container">
            {links.map((link) => (
              <Button
                key={link.id}
                variant="ghost"
                className="w-full h-auto p-2 justify-between hover:bg-transparent hover:underline"
                onClick={() => handleLinkClick(link.id)}
                disabled={clickMutation.isPending}
              >
                <span className="font-normal">{link.title}</span>
                <div className="flex items-center gap-2 text-xs opacity-60">
                  {isAdminView && <span>{link.clickCount}</span>}
                  <ExternalLink className="h-3 w-3" />
                </div>
              </Button>
            ))}
          </div>
        );
        
      case "cards":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 links-container">
            {links.map((link) => (
              <Card key={link.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent 
                  className="p-4"
                  onClick={() => handleLinkClick(link.id)}
                >
                  <div className="space-y-3">
                    {link.iconUrl && (
                      <img src={link.iconUrl} alt="" className="h-8 w-8 rounded" />
                    )}
                    <div>
                      <h3 className="font-medium text-sm">{link.title}</h3>
                      {link.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {link.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      {isAdminView && (
                        <Badge variant="secondary" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          {link.clickCount}
                        </Badge>
                      )}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
        
      default: // default layout
        return (
          <div className="space-y-3 links-container">
            {links.map((link) => (
              <LinkButton key={link.id} link={link} onLinkClick={handleLinkClick} isLoading={clickMutation.isPending} isAdminView={isAdminView} />
            ))}
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Links
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderLinks()}
      </CardContent>
    </Card>
  );
}

function LinkButton({ 
  link, 
  onLinkClick, 
  isLoading,
  isAdminView = false
}: { 
  link: any; 
  onLinkClick: (id: number) => void; 
  isLoading: boolean;
  isAdminView?: boolean;
}) {
  return (
    <Button
      variant="outline"
      className="w-full h-auto p-4 justify-between"
      style={{
        backgroundColor: link.backgroundColor,
        color: link.textColor,
        borderColor: link.backgroundColor,
      }}
      onClick={() => onLinkClick(link.id)}
      disabled={isLoading}
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
        {isAdminView && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {link.clickCount}
          </Badge>
        )}
        <ExternalLink className="h-4 w-4" />
      </div>
    </Button>
  );
}
