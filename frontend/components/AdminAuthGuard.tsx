import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

function AdminAuthGuardContent({ children }: AdminAuthGuardProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState(() => 
    localStorage.getItem("admin_token")
  );
  const { toast } = useToast();

  // Check if setup is needed
  const setupQuery = useQuery({
    queryKey: ["auth", "setup"],
    queryFn: async () => {
      try {
        return await backend.auth.checkSetup();
      } catch (error: any) {
        console.error("Setup check failed:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Verify session if we have a token
  const sessionQuery = useQuery({
    queryKey: ["auth", "session", authToken],
    queryFn: async () => {
      if (!authToken) return { valid: false };
      try {
        return await backend.auth.verifySession({
          authorization: `Bearer ${authToken}`
        });
      } catch (error: any) {
        console.error("Session verification failed:", error);
        return { valid: false };
      }
    },
    enabled: !!authToken,
    retry: 1,
  });

  useEffect(() => {
    // Clear invalid token
    if (authToken && sessionQuery.data && !sessionQuery.data.valid) {
      localStorage.removeItem("admin_token");
      setAuthToken(null);
    }
  }, [authToken, sessionQuery.data]);

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await backend.auth.setupPassword({ password });
      toast({
        title: "Password Set!",
        description: "Admin password has been configured successfully.",
      });
      setPassword("");
      setupQuery.refetch();
    } catch (error: any) {
      console.error("Failed to setup password:", error);
      toast({
        title: "Setup Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your admin password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await backend.auth.login({ password });
      localStorage.setItem("admin_token", response.token);
      setAuthToken(response.token);
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard.",
      });
      setPassword("");
    } catch (error: any) {
      console.error("Failed to login:", error);
      toast({
        title: "Login Failed",
        description: error.message === "invalid password" ? "Incorrect password." : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await backend.auth.logout({
          authorization: `Bearer ${authToken}`
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    localStorage.removeItem("admin_token");
    setAuthToken(null);
  };

  // Loading state
  if (setupQuery.isLoading || (authToken && sessionQuery.isLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  // Error state
  if (setupQuery.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Failed to load authentication status</p>
            <p className="text-sm text-destructive mb-4">
              {setupQuery.error instanceof Error ? setupQuery.error.message : "An unexpected error occurred"}
            </p>
            <Button onClick={() => setupQuery.refetch()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Setup needed
  if (setupQuery.data?.needsSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Setup</CardTitle>
            <CardDescription>
              Set up your admin password to secure the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetupPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setup-password">Admin Password</Label>
                <Input
                  id="setup-password"
                  type="password"
                  placeholder="Enter a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters long
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" text="Setting up..." />
                ) : (
                  "Set Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login required
  if (!authToken || (sessionQuery.data && !sessionQuery.data.valid)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Enter your password to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" text="Logging in..." />
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated - show admin dashboard with logout option
  return (
    <div>
      <div className="hidden logout-handler">
        <Button onClick={handleLogout} variant="ghost" size="sm">
          Logout
        </Button>
      </div>
      {children}
    </div>
  );
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  return (
    <ErrorBoundary>
      <AdminAuthGuardContent>{children}</AdminAuthGuardContent>
    </ErrorBoundary>
  );
}
