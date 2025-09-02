import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, MessageSquare, ExternalLink, Eye, Users, Globe, Smartphone, TrendingUp, Share2 } from "lucide-react";
import { StatsLoadingSkeleton, CardLoadingSkeleton } from "./LoadingSkeleton";
import ErrorBoundary from "./ErrorBoundary";
import VisitorChart from "./VisitorChart";
import LinkHeatmap from "./LinkHeatmap";
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

  // Ensure arrays exist and provide fallbacks
  const topLinks = stats.topLinks || [];
  const recentActivity = stats.recentActivity || [];
  const deviceStats = stats.deviceStats || [];
  const locationStats = stats.locationStats || [];
  const socialStats = stats.socialStats || [];
  const hourlyActivity = stats.hourlyActivity || [];
  const dailyActivity = stats.dailyActivity || [];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalPageViews || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.uniqueVisitors || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalLinkClicks || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Referrals</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalSocialReferrals || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalGuestEntries || 0)}</div>
            {(stats.pendingGuestEntries || 0) > 0 && (
              <Badge variant="secondary" className="mt-1">
                {stats.pendingGuestEntries} pending
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="heatmap">Link Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Links</CardTitle>
                <CardDescription>Most clicked links</CardDescription>
              </CardHeader>
              <CardContent>
                {topLinks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No link clicks yet</p>
                ) : (
                  <div className="space-y-3">
                    {topLinks.map((link) => (
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
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest visitor interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recent activity</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {activity.type === "page_view" && <Eye className="h-4 w-4 text-blue-500" />}
                          {activity.type === "link_click" && <ExternalLink className="h-4 w-4 text-green-500" />}
                          {activity.type === "guest_entry" && <MessageSquare className="h-4 w-4 text-purple-500" />}
                          {activity.type === "social_referral" && <Share2 className="h-4 w-4 text-orange-500" />}
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
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <VisitorChart 
            hourlyData={hourlyActivity}
            dailyData={dailyActivity}
          />
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Types
                </CardTitle>
                <CardDescription>Visitor devices breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {deviceStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No device data yet</p>
                ) : (
                  <div className="space-y-3">
                    {deviceStats.map((device) => (
                      <div key={device.device} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{device.device}</div>
                          <div className="text-sm text-muted-foreground">
                            {device.count} visits
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{device.percentage}%</div>
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${device.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Visitor Locations
                </CardTitle>
                <CardDescription>Top countries by visits</CardDescription>
              </CardHeader>
              <CardContent>
                {locationStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No location data yet</p>
                ) : (
                  <div className="space-y-3">
                    {locationStats.map((location) => (
                      <div key={location.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{location.country}</div>
                          <div className="text-sm text-muted-foreground">
                            {location.count} visits
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{location.percentage}%</div>
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${location.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Social Referrals
                </CardTitle>
                <CardDescription>Traffic from social platforms</CardDescription>
              </CardHeader>
              <CardContent>
                {socialStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No social referrals yet</p>
                ) : (
                  <div className="space-y-3">
                    {socialStats.map((social) => (
                      <div key={social.platform} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="font-medium capitalize">{social.platform}</div>
                          <div className="text-sm text-muted-foreground">
                            {social.count} referrals
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{social.percentage}%</div>
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${social.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-6">
          <LinkHeatmap />
        </TabsContent>
      </Tabs>
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
