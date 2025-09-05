import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MousePointer, Clock, Calendar, Smartphone, Globe } from "lucide-react";
import { CardLoadingSkeleton } from "./LoadingSkeleton";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

function LinkHeatmapContent() {
  const [selectedDays, setSelectedDays] = useState("30");

  const heatmapQuery = useQuery({
    queryKey: ["analytics", "heatmap", selectedDays],
    queryFn: async () => {
      try {
        return await backend.analytics.getLinkHeatmap({ days: 22 });
      } catch (error: any) {
        console.error("Heatmap fetch failed:", error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  if (heatmapQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Link Click Heatmap</CardTitle>
                <CardDescription>Detailed analytics for each link</CardDescription>
              </div>
              <Select disabled>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="30 days" />
                </SelectTrigger>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <CardLoadingSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (heatmapQuery.isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="text-center py-12">
          <MousePointer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Failed to load heatmap data</p>
          <p className="text-sm text-destructive">
            {heatmapQuery.error instanceof Error ? heatmapQuery.error.message : "An unexpected error occurred"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const heatmapData = heatmapQuery.data?.heatmapData || [];

  if (heatmapData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5" />
            Link Click Heatmap
          </CardTitle>
          <CardDescription>Detailed analytics for each link</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <MousePointer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No link data available</p>
          <p className="text-sm text-muted-foreground">Create some links to see click analytics</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Link Click Heatmap
              </CardTitle>
              <CardDescription>Detailed analytics for each link</CardDescription>
            </div>
            <Select value={selectedDays} onValueChange={setSelectedDays}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {heatmapData.map((link) => (
              <div key={link.linkId} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{link.title}</h3>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MousePointer className="h-3 w-3" />
                    {link.totalClicks} total clicks
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Hourly Clicks */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Clicks by Hour
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={link.clicksByHour}>
                            <XAxis 
                              dataKey="hour" 
                              fontSize={10}
                              tickFormatter={(value) => `${value}:00`}
                            />
                            <YAxis fontSize={10} />
                            <Tooltip 
                              labelFormatter={(value) => `${value}:00`}
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                                fontSize: '12px'
                              }}
                            />
                            <Bar 
                              dataKey="clicks" 
                              fill="hsl(var(--primary))" 
                              radius={[1, 1, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Daily Clicks */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Daily Clicks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={link.clicksByDay}>
                            <XAxis 
                              dataKey="date" 
                              fontSize={10}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis fontSize={10} />
                            <Tooltip 
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                                fontSize: '12px'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="clicks" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={{ r: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Device Breakdown */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Device Types
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {link.clicksByDevice.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No device data</p>
                      ) : (
                        <div className="space-y-2">
                          {link.clicksByDevice.map((device, index) => (
                            <div key={device.device} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span>{device.device}</span>
                              </div>
                              <span className="font-medium">{device.clicks}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Country Breakdown */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Top Countries
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {link.clicksByCountry.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No location data</p>
                      ) : (
                        <div className="space-y-2">
                          {link.clicksByCountry.slice(0, 5).map((country, index) => (
                            <div key={country.country} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span>{country.country}</span>
                              </div>
                              <span className="font-medium">{country.clicks}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LinkHeatmap() {
  return (
    <ErrorBoundary>
      <LinkHeatmapContent />
    </ErrorBoundary>
  );
}
