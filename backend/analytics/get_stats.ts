import { api } from "encore.dev/api";
import { analyticsDB } from "./db";

export interface AnalyticsStats {
  totalLinkClicks: number;
  totalGuestEntries: number;
  pendingGuestEntries: number;
  totalPageViews: number;
  uniqueVisitors: number;
  totalSocialReferrals: number;
  topLinks: Array<{
    id: number;
    title: string;
    clickCount: number;
  }>;
  recentActivity: Array<{
    type: "guest_entry" | "page_view" | "link_click" | "social_referral";
    description: string;
    timestamp: Date;
  }>;
  deviceStats: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  locationStats: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  socialStats: Array<{
    platform: string;
    count: number;
    percentage: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    views: number;
    clicks: number;
  }>;
  dailyActivity: Array<{
    date: string;
    views: number;
    clicks: number;
    uniqueVisitors: number;
  }>;
}

// Retrieves comprehensive analytics statistics.
export const getStats = api<void, AnalyticsStats>(
  { expose: true, method: "GET", path: "/analytics" },
  async () => {
    // Get total link clicks
    const linkStats = await analyticsDB.queryRow<{ totalClicks: string }>`
      SELECT COALESCE(SUM(click_count), 0)::text as "totalClicks"
      FROM links 
    `;

    // Get guest entry stats
    const guestStats = await analyticsDB.queryRow<{ total: string; pending: string }>`
      SELECT 
        COALESCE(COUNT(*), 0)::text as total,
        COALESCE(SUM(CASE WHEN is_approved = false THEN 1 ELSE 0 END), 0)::text as pending
      FROM guest_entries 
    `;

    // Get page view stats
    const pageViewStats = await analyticsDB.queryRow<{ totalViews: string; uniqueVisitors: string }>`
      SELECT 
        COALESCE(COUNT(*), 0)::text as "totalViews",
        COALESCE(COUNT(DISTINCT visitor_id), 0)::text as "uniqueVisitors"
      FROM page_views 
    `;

    // Get social referral stats
    const socialStats = await analyticsDB.queryRow<{ totalSocialReferrals: string }>`
      SELECT COALESCE(COUNT(*), 0)::text as "totalSocialReferrals"
      FROM social_referrals 
    `;

    // Get top links
    const topLinks = await analyticsDB.queryAll<{ id: number; title: string; clickCount: number }>`
      SELECT id, title, click_count as "clickCount"
      FROM links 
      WHERE click_count > 0
      ORDER BY click_count DESC
      LIMIT 5
    `;

    // Recent activity (last 20 activities)
    const recentPageViews = await analyticsDB.queryAll<{ description: string; timestamp: Date }>`
      SELECT 
        CONCAT('Page view from ', COALESCE(country, 'Unknown'), ' (', device_type, ')') as description,
        created_at as timestamp
      FROM page_views
      ORDER BY created_at DESC
      LIMIT 8
    `;

    const recentLinkClicks = await analyticsDB.queryAll<{ description: string; timestamp: Date }>`
      SELECT 
        CONCAT('Link clicked: ', l.title) as description,
        lc.created_at as timestamp
      FROM link_clicks lc
      JOIN links l ON lc.link_id = l.id
      ORDER BY lc.created_at DESC
      LIMIT 8
    `;

    const recentGuestEntries = await analyticsDB.queryAll<{ description: string; timestamp: Date }>`
      SELECT 
        CONCAT('Guest entry from ', COALESCE(nickname, 'Anonymous')) as description,
        created_at as timestamp
      FROM guest_entries
      ORDER BY created_at DESC
      LIMIT 4
    `;

    const recentSocialReferrals = await analyticsDB.queryAll<{ description: string; timestamp: Date }>`
      SELECT 
        CONCAT('Visitor from ', platform) as description,
        created_at as timestamp
      FROM social_referrals
      ORDER BY created_at DESC
      LIMIT 5
    `;

    // Combine and sort all activities
    const allActivities = [
      ...recentPageViews.map(item => ({ ...item, type: "page_view" as const })),
      ...recentLinkClicks.map(item => ({ ...item, type: "link_click" as const })),
      ...recentGuestEntries.map(item => ({ ...item, type: "guest_entry" as const })),
      ...recentSocialReferrals.map(item => ({ ...item, type: "social_referral" as const }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);

    // Device statistics
    const deviceStats = await analyticsDB.queryAll<{ device: string; count: number }>`
      SELECT 
        COALESCE(device_type, 'Unknown') as device,
        COUNT(*)::integer as count
      FROM page_views
      GROUP BY device_type
      ORDER BY count DESC
    `;

    const totalDeviceViews = deviceStats.reduce((sum, stat) => sum + stat.count, 0);
    const deviceStatsWithPercentage = deviceStats.map(stat => ({
      ...stat,
      percentage: totalDeviceViews > 0 ? Math.round((stat.count / totalDeviceViews) * 100) : 0
    }));

    // Location statistics
    const locationStats = await analyticsDB.queryAll<{ country: string; count: number }>`
      SELECT 
        COALESCE(country, 'Unknown') as country,
        COUNT(*)::integer as count
      FROM page_views
      WHERE country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `;

    const totalLocationViews = locationStats.reduce((sum, stat) => sum + stat.count, 0);
    const locationStatsWithPercentage = locationStats.map(stat => ({
      ...stat,
      percentage: totalLocationViews > 0 ? Math.round((stat.count / totalLocationViews) * 100) : 0
    }));

    // Social media statistics
    const socialPlatformStats = await analyticsDB.queryAll<{ platform: string; count: number }>`
      SELECT 
        platform,
        COUNT(*)::integer as count
      FROM social_referrals
      GROUP BY platform
      ORDER BY count DESC
    `;

    const totalSocialReferrals = socialPlatformStats.reduce((sum, stat) => sum + stat.count, 0);
    const socialStatsWithPercentage = socialPlatformStats.map(stat => ({
      ...stat,
      percentage: totalSocialReferrals > 0 ? Math.round((stat.count / totalSocialReferrals) * 100) : 0
    }));

    // Hourly activity (24 hours)
    const hourlyActivity = await analyticsDB.queryAll<{ hour: number; views: number; clicks: number }>`
      WITH hours AS (
        SELECT generate_series(0, 23) as hour
      ),
      hourly_views AS (
        SELECT 
          EXTRACT(hour FROM created_at)::integer as hour,
          COUNT(*)::integer as views
        FROM page_views 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY EXTRACT(hour FROM created_at)
      ),
      hourly_clicks AS (
        SELECT 
          EXTRACT(hour FROM created_at)::integer as hour,
          COUNT(*)::integer as clicks
        FROM link_clicks 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY EXTRACT(hour FROM created_at)
      )
      SELECT 
        h.hour,
        COALESCE(hv.views, 0) as views,
        COALESCE(hc.clicks, 0) as clicks
      FROM hours h
      LEFT JOIN hourly_views hv ON h.hour = hv.hour
      LEFT JOIN hourly_clicks hc ON h.hour = hc.hour
      ORDER BY h.hour
    `;

    // Daily activity (last 30 days)
    const dailyActivity = await analyticsDB.queryAll<{ date: string; views: number; clicks: number; uniqueVisitors: number }>`
      WITH dates AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '29 days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      ),
      daily_views AS (
        SELECT 
          created_at::date as date,
          COUNT(*)::integer as views,
          COUNT(DISTINCT visitor_id)::integer as unique_visitors
        FROM page_views 
        WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
        GROUP BY created_at::date
      ),
      daily_clicks AS (
        SELECT 
          created_at::date as date,
          COUNT(*)::integer as clicks
        FROM link_clicks 
        WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
        GROUP BY created_at::date
      )
      SELECT 
        d.date::text,
        COALESCE(dv.views, 0) as views,
        COALESCE(dc.clicks, 0) as clicks,
        COALESCE(dv.unique_visitors, 0) as "uniqueVisitors"
      FROM dates d
      LEFT JOIN daily_views dv ON d.date = dv.date
      LEFT JOIN daily_clicks dc ON d.date = dc.date
      ORDER BY d.date
    `;

    return {
      totalLinkClicks: parseInt(linkStats?.totalClicks || "0"),
      totalGuestEntries: parseInt(guestStats?.total || "0"),
      pendingGuestEntries: parseInt(guestStats?.pending || "0"),
      totalPageViews: parseInt(pageViewStats?.totalViews || "0"),
      uniqueVisitors: parseInt(pageViewStats?.uniqueVisitors || "0"),
      totalSocialReferrals: parseInt(socialStats?.totalSocialReferrals || "0"),
      topLinks,
      recentActivity: allActivities,
      deviceStats: deviceStatsWithPercentage,
      locationStats: locationStatsWithPercentage,
      socialStats: socialStatsWithPercentage,
      hourlyActivity,
      dailyActivity
    };
  }
);
