import { api } from "encore.dev/api";
import { analyticsDB } from "./db";

export interface AnalyticsStats {
  totalLinkClicks: number;
  totalPurchases: number;
  totalRevenueCents: number;
  totalGuestEntries: number;
  pendingGuestEntries: number;
  topLinks: Array<{
    id: number;
    title: string;
    clickCount: number;
  }>;
  topProducts: Array<{
    id: number;
    title: string;
    purchaseCount: number;
    revenueCents: number;
  }>;
  recentActivity: Array<{
    type: "link_click" | "purchase" | "guest_entry";
    description: string;
    timestamp: Date;
  }>;
}

// Retrieves analytics statistics.
export const getStats = api<void, AnalyticsStats>(
  { expose: true, method: "GET", path: "/analytics" },
  async () => {
    // Get total link clicks
    const linkStats = await analyticsDB.queryRow<{ totalClicks: string }>`
      SELECT COALESCE(SUM(click_count), 0)::text as "totalClicks"
      FROM links 
    `;

    // Get purchase stats
    const purchaseStats = await analyticsDB.queryRow<{ totalPurchases: string; totalRevenue: string }>`
      SELECT 
        COALESCE(COUNT(*), 0)::text as "totalPurchases",
        COALESCE(SUM(amount_paid_cents), 0)::text as "totalRevenue"
      FROM purchases p
      JOIN products pr ON p.product_id = pr.id
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

    // Get top products
    const topProducts = await analyticsDB.queryAll<{ id: number; title: string; purchaseCount: number; revenueCents: string }>`
      SELECT 
        pr.id, 
        pr.title, 
        pr.purchase_count as "purchaseCount",
        COALESCE(SUM(p.amount_paid_cents), 0)::text as "revenueCents"
      FROM products pr
      LEFT JOIN purchases p ON pr.id = p.product_id
      WHERE pr.purchase_count > 0
      GROUP BY pr.id, pr.title, pr.purchase_count
      ORDER BY pr.purchase_count DESC
      LIMIT 5
    `;

    // Get recent activity (simplified)
    const recentPurchases = await analyticsDB.queryAll<{ description: string; timestamp: Date }>`
      SELECT 
        CONCAT('Purchase: ', pr.title) as description,
        p.created_at as timestamp
      FROM purchases p
      JOIN products pr ON p.product_id = pr.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `;

    const recentEntries = await analyticsDB.queryAll<{ description: string; timestamp: Date }>`
      SELECT 
        CONCAT('Guest entry from ', COALESCE(nickname, 'Anonymous')) as description,
        created_at as timestamp
      FROM guest_entries
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Combine and sort recent activity
    const recentActivity = [
      ...recentPurchases.map(item => ({ ...item, type: "purchase" as const })),
      ...recentEntries.map(item => ({ ...item, type: "guest_entry" as const }))
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalLinkClicks: parseInt(linkStats?.totalClicks || "0"),
      totalPurchases: parseInt(purchaseStats?.totalPurchases || "0"),
      totalRevenueCents: parseInt(purchaseStats?.totalRevenue || "0"),
      totalGuestEntries: parseInt(guestStats?.total || "0"),
      pendingGuestEntries: parseInt(guestStats?.pending || "0"),
      topLinks,
      topProducts: topProducts.map(p => ({
        ...p,
        revenueCents: parseInt(p.revenueCents)
      })),
      recentActivity
    };
  }
);
