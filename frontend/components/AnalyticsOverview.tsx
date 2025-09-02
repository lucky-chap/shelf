import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, DollarSign, MessageSquare, ExternalLink } from "lucide-react";
import { StatsLoadingSkeleton, CardLoadingSkeleton } from "./LoadingSkeleton";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

function AnalyticsContent() {
  const statsQuery = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      try {
        return await backend.analytics.getStats();
      } catch (error: any) {
        console.error("Analytics fetch failed:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  if (statsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <StatsLoadingSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardLoadingSkeleton />
          <CardLoadingSkeleton />
        </div>
        <CardLoadingSkeleton />
      </div>
    );
  }

  if (statsQuery.isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Failed to load analytics data</p>
          <p className="text-sm text-destructive">
            {statsQuery.error instanceof Error ? statsQuery.error.message : "An unexpected error occurred"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!statsQuery.data) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const stats = statsQuery.data;

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Link Clicks</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLinkClicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalRevenueCents)} revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGuestEntries}</div>
            {stats.pendingGuestEntries > 0 && (
              <Badge variant="secondary" className="mt-1">
                {stats.pendingGuestEntries} pending
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenueCents)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Links</CardTitle>
            <CardDescription>Most clicked links</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topLinks.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No link clicks yet</p>
            ) : (
              <div className="space-y-3">
                {stats.topLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between">
                    <div className="truncate">
                      <div className="font-medium">{link.title}</div>
                    </div>
                    <Badge variant="secondary">{link.clickCount} clicks</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No sales yet</p>
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="truncate">
                      <div className="font-medium">{product.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(product.revenueCents)} revenue
                      </div>
                    </div>
                    <Badge variant="secondary">{product.purchaseCount} sales</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest purchases and guest messages</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activity.type === "purchase" ? (
                      <DollarSign className="h-4 w-4 text-green-500" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-sm">{activity.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsOverview() {
  return (
    <ErrorBoundary>
      <AnalyticsContent />
    </ErrorBoundary>
  );
}
