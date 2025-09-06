import { api } from "encore.dev/api";
import { analyticsDB } from "./db";
import { Header } from "encore.dev/api";

export interface TrackUserActivityRequest {
  visitorId: string;
  page?: string;
  userAgent?: Header<"User-Agent">;
}

export interface TrackUserActivityResponse {
  success: boolean;
}

// Tracks user activity to maintain active users count.
export const trackUserActivity = api<TrackUserActivityRequest, TrackUserActivityResponse>(
  { expose: true, method: "POST", path: "/analytics/user-activity" },
  async (req) => {
    const page = req.page || "/";
    
    await analyticsDB.exec`
      INSERT INTO active_users (visitor_id, page, user_agent, last_seen, created_at)
      VALUES (${req.visitorId}, ${page}, ${req.userAgent || null}, NOW(), NOW())
      ON CONFLICT (visitor_id) DO UPDATE SET
        last_seen = NOW(),
        page = EXCLUDED.page,
        user_agent = EXCLUDED.user_agent
    `;

    return { success: true };
  }
);
