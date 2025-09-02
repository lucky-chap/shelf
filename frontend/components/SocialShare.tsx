import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Twitter, Facebook, Linkedin, MessageCircle, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generateVisitorId } from "../utils/analytics";
import backend from "~backend/client";

interface SocialShareProps {
  title: string;
  description: string;
  url?: string;
}

export default function SocialShare({ title, description, url }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = url || window.location.href;
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedUrl = encodeURIComponent(shareUrl);

  const trackSocialMutation = useMutation({
    mutationFn: async (platform: string) => {
      const visitorId = generateVisitorId();
      return await backend.analytics.trackSocialReferral({ 
        platform, 
        visitorId 
      });
    },
    onError: (error: any) => {
      console.error("Failed to track social share:", error);
    },
  });

  const socialPlatforms = [
    {
      name: "Twitter",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "hover:bg-blue-50 hover:text-blue-600",
      platform: "twitter"
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      color: "hover:bg-blue-50 hover:text-blue-700",
      platform: "facebook"
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
      color: "hover:bg-blue-50 hover:text-blue-800",
      platform: "linkedin"
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:bg-green-50 hover:text-green-600",
      platform: "whatsapp"
    }
  ];

  const handleShare = (platform: string, url: string) => {
    trackSocialMutation.mutate(platform);
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "The link has been copied to your clipboard.",
      });
      
      // Track copy as a social action
      trackSocialMutation.mutate("copy_link");
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast({
        title: "Copy Failed",
        description: "Unable to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share This Page
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {socialPlatforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <Button
                key={platform.name}
                variant="outline"
                className={`flex items-center gap-2 h-12 transition-colors ${platform.color}`}
                onClick={() => handleShare(platform.platform, platform.url)}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{platform.name}</span>
              </Button>
            );
          })}
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 p-2 bg-muted rounded text-sm font-mono text-muted-foreground overflow-hidden">
            <div className="truncate">{shareUrl}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="flex items-center gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
