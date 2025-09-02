import { api } from "encore.dev/api";
import { analyticsDB } from "./db";
import { Header } from "encore.dev/api";

export interface TrackPageViewRequest {
  page: string;
  userAgent?: Header<"User-Agent">;
  visitorIP?: Header<"X-Forwarded-For">;
  country?: Header<"CF-IPCountry">;
  visitorId: string;
}

export interface TrackPageViewResponse {
  success: boolean;
}

// Tracks a page view with visitor analytics.
export const trackPageView = api<TrackPageViewRequest, TrackPageViewResponse>(
  { expose: true, method: "POST", path: "/analytics/page-view" },
  async (req) => {
    const deviceType = getDeviceType(req.userAgent || "");
    const country = req.country || null;
    
    await analyticsDB.exec`
      INSERT INTO page_views (
        page, visitor_id, visitor_ip, user_agent, device_type, country, created_at
      ) VALUES (
        ${req.page}, 
        ${req.visitorId}, 
        ${req.visitorIP || null}, 
        ${req.userAgent || null}, 
        ${deviceType}, 
        ${country}, 
        NOW()
      )
    `;

    return { success: true };
  }
);

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet';
  } else {
    return 'Desktop';
  }
}
