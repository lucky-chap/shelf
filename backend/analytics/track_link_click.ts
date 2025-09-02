import { api } from "encore.dev/api";
import { analyticsDB } from "./db";
import { Header } from "encore.dev/api";

export interface TrackLinkClickRequest {
  linkId: number;
  visitorId: string;
  userAgent?: Header<"User-Agent">;
  visitorIP?: Header<"X-Forwarded-For">;
  country?: Header<"CF-IPCountry">;
}

export interface TrackLinkClickResponse {
  success: boolean;
}

// Tracks a link click with visitor analytics.
export const trackLinkClick = api<TrackLinkClickRequest, TrackLinkClickResponse>(
  { expose: true, method: "POST", path: "/analytics/link-click" },
  async (req) => {
    const deviceType = getDeviceType(req.userAgent || "");
    const country = req.country || null;
    
    await analyticsDB.exec`
      INSERT INTO link_clicks (
        link_id, visitor_id, visitor_ip, user_agent, device_type, country, created_at
      ) VALUES (
        ${req.linkId}, 
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
