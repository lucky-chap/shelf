import { api } from "encore.dev/api";
import { analyticsDB } from "./db";
import { Query } from "encore.dev/api";

export interface GetLinkHeatmapParams {
  days?: Query<number>;
}

export interface LinkHeatmapData {
  linkId: number;
  title: string;
  totalClicks: number;
  clicksByHour: Array<{
    hour: number;
    clicks: number;
  }>;
  clicksByDay: Array<{
    date: string;
    clicks: number;
  }>;
  clicksByDevice: Array<{
    device: string;
    clicks: number;
  }>;
  clicksByCountry: Array<{
    country: string;
    clicks: number;
  }>;
}

export interface GetLinkHeatmapResponse {
  heatmapData: LinkHeatmapData[];
}

// Retrieves detailed click heatmap data for all links.
export const getLinkHeatmap = api<GetLinkHeatmapParams, GetLinkHeatmapResponse>(
  { expose: true, method: "GET", path: "/analytics/link-heatmap" },
  async (params) => {
    const days = params.days || 30;
    
    const links = await analyticsDB.queryAll<{ id: number; title: string; totalClicks: number }>`
      SELECT l.id, l.title, l.click_count as "totalClicks"
      FROM links l
      WHERE l.is_active = true
      ORDER BY l.click_count DESC
    `;

    const heatmapData: LinkHeatmapData[] = [];

    for (const link of links) {
      // Clicks by hour
      const clicksByHour = await analyticsDB.queryAll<{ hour: number; clicks: number }>`
        WITH hours AS (
          SELECT generate_series(0, 23) as hour
        ),
        link_clicks_by_hour AS (
          SELECT 
            EXTRACT(hour FROM created_at)::integer as hour,
            COUNT(*)::integer as clicks
          FROM link_clicks 
          WHERE link_id = ${link.id} 
            AND created_at >= NOW() - INTERVAL '${days} days'
          GROUP BY EXTRACT(hour FROM created_at)
        )
        SELECT 
          h.hour,
          COALESCE(lch.clicks, 0) as clicks
        FROM hours h
        LEFT JOIN link_clicks_by_hour lch ON h.hour = lch.hour
        ORDER BY h.hour
      `;

      // Clicks by day
      const clicksByDay = await analyticsDB.queryAll<{ date: string; clicks: number }>`
        WITH dates AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '${days - 1} days',
            CURRENT_DATE,
            '1 day'::interval
          )::date as date
        ),
        link_clicks_by_day AS (
          SELECT 
            created_at::date as date,
            COUNT(*)::integer as clicks
          FROM link_clicks 
          WHERE link_id = ${link.id} 
            AND created_at >= CURRENT_DATE - INTERVAL '${days - 1} days'
          GROUP BY created_at::date
        )
        SELECT 
          d.date::text,
          COALESCE(lcd.clicks, 0) as clicks
        FROM dates d
        LEFT JOIN link_clicks_by_day lcd ON d.date = lcd.date
        ORDER BY d.date
      `;

      // Clicks by device
      const clicksByDevice = await analyticsDB.queryAll<{ device: string; clicks: number }>`
        SELECT 
          COALESCE(device_type, 'Unknown') as device,
          COUNT(*)::integer as clicks
        FROM link_clicks
        WHERE link_id = ${link.id} 
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY device_type
        ORDER BY clicks DESC
      `;

      // Clicks by country
      const clicksByCountry = await analyticsDB.queryAll<{ country: string; clicks: number }>`
        SELECT 
          COALESCE(country, 'Unknown') as country,
          COUNT(*)::integer as clicks
        FROM link_clicks
        WHERE link_id = ${link.id} 
          AND created_at >= NOW() - INTERVAL '${days} days'
          AND country IS NOT NULL
        GROUP BY country
        ORDER BY clicks DESC
        LIMIT 10
      `;

      heatmapData.push({
        linkId: link.id,
        title: link.title,
        totalClicks: link.totalClicks,
        clicksByHour,
        clicksByDay,
        clicksByDevice,
        clicksByCountry
      });
    }

    return { heatmapData };
  }
);
