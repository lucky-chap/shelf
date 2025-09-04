import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import LinksList from "../components/LinksList";
import GuestbookSection from "../components/GuestbookSection";
import SocialShare from "../components/SocialShare";
import ProductsSection from "../components/ProductsSection";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBoundary from "../components/ErrorBoundary";
import { trackPageView } from "../utils/analytics";
import { themePresets } from "../components/ThemePresetSelector";
import backend from "~backend/client";
	import { useStripeKey } from "../utils/hooks"

function LandingPageContent() {
	const data = useStripeKey()
d	console.log("data: ", data)
  const configQuery = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      try {
        return await backend.config.get();
      } catch (error: any) {
        console.error("Failed to fetch config:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Track page view when component mounts
  useEffect(() => {
    trackPageView('/');
  }, []);

  if (configQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (configQuery.isError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="border-destructive max-w-md w-full">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">Failed to load page</p>
            <p className="text-sm text-destructive mb-4">
              {configQuery.error instanceof Error ? configQuery.error.message : "An unexpected error occurred"}
            </p>
            <Button onClick={() => configQuery.refetch()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = configQuery.data || {
    title: "My Landing Page",
    description: "Welcome to my creator landing page",
    themeColor: "#3B82F6",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    avatarUrl: null,
    backgroundType: "solid",
    backgroundImageUrl: null,
    selectedTheme: null
  };

  // Apply theme preset styles if a theme is selected
  const selectedThemePreset = config.selectedTheme 
    ? themePresets.find(t => t.id === config.selectedTheme)
    : null;

  // Determine background styles
  const getBackgroundStyles = () => {
    const baseStyles: React.CSSProperties = {
      color: config.textColor,
      minHeight: "100vh"
    };

    if (config.backgroundType === "unsplash" && config.backgroundImageUrl) {
      return {
        ...baseStyles,
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${config.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      };
    } else {
      return {
        ...baseStyles,
        backgroundColor: config.backgroundColor
      };
    }
  };

  // Apply theme-specific classes
  const getThemeClasses = () => {
    if (!selectedThemePreset) return "";
    
    let classes = "";
    
    // Font family
    if (selectedThemePreset.fontFamily === "serif") {
      classes += " font-serif";
    } else if (selectedThemePreset.fontFamily === "mono") {
      classes += " font-mono";
    } else {
      classes += " font-sans";
    }
    
    return classes;
  };

  // Button styles based on theme
  const getButtonStyles = () => {
    if (!selectedThemePreset) return {};
    
    const styles: React.CSSProperties = {};
    
    if (selectedThemePreset.buttonStyle === "pill") {
      styles.borderRadius = "9999px";
    } else if (selectedThemePreset.buttonStyle === "square") {
      styles.borderRadius = "4px";
    }
    
    return styles;
  };

  const currentUrl = window.location.href;
  const ogImageUrl = config.avatarUrl || `${window.location.origin}/og-default.png`;

  return (
    <>
      <Helmet>
        {/* Basic meta tags */}
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <meta name="theme-color" content={config.themeColor} />
        
        {/* Open Graph meta tags for social media */}
        <meta property="og:title" content={config.title} />
        <meta property="og:description" content={config.description} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:alt" content={`${config.title} - Landing Page`} />
        <meta property="og:site_name" content={config.title} />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={config.title} />
        <meta name="twitter:description" content={config.description} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="twitter:image:alt" content={`${config.title} - Landing Page`} />
        
        {/* Additional SEO meta tags */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={currentUrl} />
        
        {/* Structured data for better search results */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": config.title,
            "description": config.description,
            "url": currentUrl,
            "image": ogImageUrl,
            "author": {
              "@type": "Person",
              "name": config.title
            }
          })}
        </script>
      </Helmet>

      <div 
        className={`${getThemeClasses()}`}
        style={getBackgroundStyles()}
      >
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Header with Admin Access */}
            <div className="flex justify-between mb-4">
              <Link to="/store">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 backdrop-blur-sm bg-white/10 border-white/20 text-current hover:bg-white/20"
                  style={getButtonStyles()}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Store
                </Button>
              </Link>
              <Link to="/admin">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 backdrop-blur-sm bg-white/10 border-white/20 text-current hover:bg-white/20"
                  style={getButtonStyles()}
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            </div>

            {/* Profile Section */}
            <Card className={config.backgroundType === "unsplash" ? "backdrop-blur-sm bg-white/90" : ""}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-24 w-24 ring-2 ring-offset-2" style={{ ringColor: config.themeColor }}>
                    <AvatarImage src={config.avatarUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {config.title.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h1 className="text-2xl font-bold" style={{ color: config.themeColor }}>
                      {config.title}
                    </h1>
                    <p className="text-muted-foreground mt-2">{config.description}</p>
                    {selectedThemePreset && (
                      <p className="text-xs text-muted-foreground mt-1 opacity-60">
                        {selectedThemePreset.name} Theme
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <ErrorBoundary>
              <div style={{ "--button-style": JSON.stringify(getButtonStyles()) } as any}>
                <LinksList />
              </div>
            </ErrorBoundary>

            <ErrorBoundary>
              <ProductsSection />
            </ErrorBoundary>

            <ErrorBoundary>
              <GuestbookSection />
            </ErrorBoundary>

            <ErrorBoundary>
              <SocialShare 
                title={config.title}
                description={config.description}
                url={currentUrl}
              />
            </ErrorBoundary>

            {/* Background attribution for Unsplash */}
            {config.backgroundType === "unsplash" && config.backgroundImageUrl && (
              <div className="text-center">
                <p className="text-xs text-white/60 backdrop-blur-sm bg-black/20 rounded px-2 py-1 inline-block">
                  Background image from Unsplash
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function LandingPage() {
  return (
    <ErrorBoundary>
      <LandingPageContent />
    </ErrorBoundary>
  );
}
