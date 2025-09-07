import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import LiveActiveUsersCounter from "../components/LiveActiveUsersCounter";
import ActiveUsersCounter from "../components/ActiveUsersCounter";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBoundary from "../components/ErrorBoundary";
import { trackPageView, generateVisitorId } from "../utils/analytics";
import { themePresets } from "../components/ThemePresetSelector";
import { layoutOptions } from "../components/LayoutSelector";
import backend from "~backend/client";
import { useStripePublishableKey } from "@/hooks/useStripe";
import { ThemeToggle } from "../components/ThemeToggle";

function LandingPageContent() {
  const { data, isLoading, isError } = useStripePublishableKey();

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

  // Track user activity for active users counter
  const trackActivityMutation = useMutation({
    mutationFn: async () => {
      const visitorId = generateVisitorId();
      return await backend.analytics.trackUserActivity({
        visitorId,
        page: "/",
      });
    },
    onError: (error: any) => {
      console.error("Failed to track user activity:", error);
    },
  });

  // Track page view and user activity when component mounts
  useEffect(() => {
    trackPageView("/");
    trackActivityMutation.mutate();

    // Set up interval to track activity every 2 minutes while user is on page
    const activityInterval = setInterval(() => {
      trackActivityMutation.mutate();
    }, 120000); // 2 minutes

    // Clean up interval on unmount
    return () => clearInterval(activityInterval);
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
              {configQuery.error instanceof Error
                ? configQuery.error.message
                : "An unexpected error occurred"}
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
    selectedTheme: null,
    layoutType: null,
    fontFamily: "Inter, sans-serif",
  };

  // Apply theme preset styles if a theme is selected
  const selectedThemePreset = config.selectedTheme
    ? themePresets.find((t) => t.id === config.selectedTheme)
    : null;

  // Get selected layout
  const selectedLayout = config.layoutType
    ? layoutOptions.find((l) => l.id === config.layoutType)
    : layoutOptions[0]; // default to first layout

  // Determine background styles
  const getBackgroundStyles = () => {
    const baseStyles: React.CSSProperties = {
      color: config.textColor,
      minHeight: "100vh",
      fontFamily: config.fontFamily || "Inter, sans-serif",
    };

    if (config.backgroundType === "unsplash" && config.backgroundImageUrl) {
      return {
        ...baseStyles,
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${config.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      };
    } else {
      return {
        ...baseStyles,
        backgroundColor: config.backgroundColor,
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

  // Get layout-specific container classes
  const getLayoutContainerClass = () => {
    switch (selectedLayout?.id) {
      case "grid":
        return "max-w-4xl";
      case "timeline":
        return "max-w-3xl";
      case "minimal":
        return "max-w-lg";
      case "cards":
        return "max-w-5xl";
      default:
        return "max-w-2xl";
    }
  };

  const currentUrl = window.location.href;
  const ogImageUrl =
    config.avatarUrl || `${window.location.origin}/og-default.png`;

  return (
    <>
      <Helmet>
        {/* Basic meta tags */}
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <meta name="theme-color" content={config.themeColor} />

        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Inter:wght@400;700&family=Merriweather:wght@400;700&family=Press+Start+2P&family=Roboto+Mono:wght@400;700&family=VT323&display=swap"
          rel="stylesheet"
        />

        {/* Open Graph meta tags for social media */}
        <meta property="og:title" content={config.title} />
        <meta property="og:description" content={config.description} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImageUrl} />
        <meta
          property="og:image:alt"
          content={`${config.title} - Landing Page`}
        />
        <meta property="og:site_name" content={config.title} />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={config.title} />
        <meta name="twitter:description" content={config.description} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta
          name="twitter:image:alt"
          content={`${config.title} - Landing Page`}
        />

        {/* Additional SEO meta tags */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={currentUrl} />

        {/* Structured data for better search results */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: config.title,
            description: config.description,
            url: currentUrl,
            image: ogImageUrl,
            author: {
              "@type": "Person",
              name: config.title,
            },
          })}
        </script>
      </Helmet>

      <div className={`${getThemeClasses()}`} style={getBackgroundStyles()}>
        <div className={`${getLayoutContainerClass()} mx-auto px-4 py-8`}>
          <div
            className={`space-y-8 layout-${selectedLayout?.id || "default"}`}
          >
            {/* Header with Admin Access and Active Users */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
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
                <ErrorBoundary fallback={<ActiveUsersCounter />}>
                  <LiveActiveUsersCounter page="/" />
                </ErrorBoundary>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
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
            </div>

            {/* Profile Section */}
            <Card
            // className={
            //   config.backgroundType === "unsplash"
            //     ? "backdrop-blur-sm bg-white/90"
            //     : ""
            // }
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar
                    className={`h-24 w-24 ring-2 ring-offset-2 ${config.themeColor}`}
                  >
                    <AvatarImage src={config.avatarUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {config.title.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h1
                      className="text-2xl font-bold"
                      style={{ color: config.themeColor }}
                    >
                      {config.title}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      {config.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ErrorBoundary>
              <div
                style={
                  { "--button-style": JSON.stringify(getButtonStyles()) } as any
                }
                className={`layout-${selectedLayout?.id || "default"}`}
              >
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
            {config.backgroundType === "unsplash" &&
              config.backgroundImageUrl && (
                <div className="text-center">
                  <p className="text-xs text-white/60 backdrop-blur-sm bg-black/20 rounded px-2 py-1 inline-block">
                    Background image from Unsplash
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Layout-specific CSS */}
      <style>{`
        .layout-grid .links-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }
        
        .layout-timeline .links-container > * {
          position: relative;
          padding-left: 2rem;
        }
        
        .layout-timeline .links-container > *::before {
          content: '';
          position: absolute;
          left: 0.5rem;
          top: 50%;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          transform: translateY(-50%);
        }
        
        .layout-minimal .links-container > * {
          border: none;
          background: transparent;
          padding: 0.5rem;
        }
        
        .layout-cards .links-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        
        @media (max-width: 768px) {
          .layout-grid .links-container,
          .layout-cards .links-container {
            grid-template-columns: 1fr;
          }
          
          .layout-timeline .links-container > * {
            padding-left: 1rem;
          }
        }
      `}</style>
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
