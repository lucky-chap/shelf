import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Eye, ExternalLink, TrendingUp } from "lucide-react";

interface VisitorChartProps {
  hourlyData: Array<{
    hour: number;
    views: number;
    clicks: number;
  }>;
  dailyData: Array<{
    date: string;
    views: number;
    clicks: number;
    uniqueVisitors: number;
  }>;
}

export default function VisitorChart({ hourlyData, dailyData }: VisitorChartProps) {
  const hourlyChartData = hourlyData.map(item => ({
    ...item,
    hourLabel: `${item.hour}:00`
  }));

  const dailyChartData = dailyData.map(item => ({
    ...item,
    dateLabel: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  const totalViews = dailyData.reduce((sum, day) => sum + day.views, 0);
  const totalClicks = dailyData.reduce((sum, day) => sum + day.clicks, 0);
  const avgVisitors = Math.round(dailyData.reduce((sum, day) => sum + day.uniqueVisitors, 0) / dailyData.length);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views (30 days)</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks (30 days)</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Visitors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgVisitors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Traffic Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Traffic (Last 30 Days)</CardTitle>
          <CardDescription>Page views, clicks, and unique visitors over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="dateLabel" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis className="text-muted-foreground" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name="Page Views"
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stackId="1"
                  stroke="hsl(var(--secondary))" 
                  fill="hsl(var(--secondary))"
                  fillOpacity={0.6}
                  name="Link Clicks"
                />
                <Line 
                  type="monotone" 
                  dataKey="uniqueVisitors" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  name="Unique Visitors"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Activity (Last 7 Days)</CardTitle>
          <CardDescription>When your visitors are most active</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="hourLabel" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis className="text-muted-foreground" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="views" 
                  fill="hsl(var(--primary))" 
                  name="Page Views"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="clicks" 
                  fill="hsl(var(--secondary))" 
                  name="Link Clicks"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
