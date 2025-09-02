import { api } from "encore.dev/api";
import { analyticsDB } from "./db";

export interface AnalyticsStats {
  totalLinkClicks: number;
  totalGuestEntries: number;
  pendingGuestEntries: number;
  topLinks: Array<{
    id: number;
    title: string;
    clickCount: number;
  }>;
  recentActivity: Array<{
    type: "guest_entry";
    description: string;
    timestamp: Date;
  }>;
}

// Retrieves analytics statistics (store data excluded).
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

    // Get top links
    const topLinks = await analyticsDB.queryAll<{ id: number; title: string; clickCount: number }>`
      SELECT id, title, click_count as "clickCount"
      FROM links 
      WHERE click_count > 0
      ORDER BY click_count DESC
      LIMIT 5
    `;

    // Recent guestbook entries
    const recentEntries = await analyticsDB.queryAll<{ description: string; timestamp: Date }>`
      SELECT 
        CONCAT('Guest entry from ', COALESCE(nickname, 'Anonymous')) as description,
        created_at as timestamp
      FROM guest_entries
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const recentActivity = recentEntries.map(item => ({ ...item, type: "guest_entry" as const }));

    return {
      totalLinkClicks: parseInt(linkStats?.totalClicks || "0"),
      totalGuestEntries: parseInt(guestStats?.total || "0"),
      pendingGuestEntries: parseInt(guestStats?.pending || "0"),
      topLinks,
      recentActivity
    };
  }
);
