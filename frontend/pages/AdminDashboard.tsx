import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Link, MessageSquare, Settings, LogOut, ShoppingBag } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import AdminAuthGuard from "../components/AdminAuthGuard";
import AnalyticsOverview from "../components/AnalyticsOverview";
import LinksManagement from "../components/LinksManagement";
import ProductsManagement from "../components/ProductsManagement";
import GuestbookManagement from "../components/GuestbookManagement";
import SiteSettings from "../components/SiteSettings";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";

function AdminDashboardContent() {
  const { toast } = useToast();

  const configQuery = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      return await backend.config.get();
    },
  });

  const handleLogout = async () => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      try {
        await backend.auth.logout({
          authorization: `Bearer ${token}`
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    localStorage.removeItem("admin_token");
    window.location.reload();
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  const config = configQuery.data || {
    title: "My Landing Page",
    description: "Welcome to my creator landing page",
    themeColor: "#3B82F6",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
    avatarUrl: null
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <RouterLink to="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Site
                </Button>
              </RouterLink>
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Links
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="guestbook" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Guestbook
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsOverview />
          </TabsContent>

          <TabsContent value="links">
            <LinksManagement />
          </TabsContent>

          <TabsContent value="store">
            <ProductsManagement />
          </TabsContent>

          <TabsContent value="guestbook">
            <GuestbookManagement />
          </TabsContent>

          <TabsContent value="settings">
            <SiteSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminAuthGuard>
      <AdminDashboardContent />
    </AdminAuthGuard>
  );
}
