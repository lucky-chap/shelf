import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import LinksList from "../components/LinksList";
import ProductsList from "../components/ProductsList";
import GuestbookSection from "../components/GuestbookSection";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBoundary from "../components/ErrorBoundary";
import backend from "~backend/client";

function LandingPageContent() {
  const configQuery = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      return await backend.config.get();
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

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
    avatarUrl: null
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: config.backgroundColor,
        color: config.textColor
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header with Admin Access */}
          <div className="flex justify-end mb-4">
            <Link to="/admin">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          </div>

          {/* Profile Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
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
                </div>
              </div>
            </CardContent>
          </Card>

          <ErrorBoundary>
            <LinksList />
          </ErrorBoundary>
          
          <ErrorBoundary>
            <ProductsList />
          </ErrorBoundary>
          
          <ErrorBoundary>
            <GuestbookSection />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <ErrorBoundary>
      <LandingPageContent />
    </ErrorBoundary>
  );
}
