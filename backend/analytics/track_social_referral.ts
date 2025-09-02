import { api } from "encore.dev/api";
import { analyticsDB } from "./db";
import { Header } from "encore.dev/api";

export interface TrackSocialReferralRequest {
  platform: string;
  visitorId: string;
  userAgent?: Header<"User-Agent">;
  visitorIP?: Header<"X-Forwarded-For">;
  country?: Header<"CF-IPCountry">;
}

export interface TrackSocialReferralResponse {
  success: boolean;
}

// Tracks a social media referral with visitor analytics.
export const trackSocialReferral = api<TrackSocialReferralRequest, TrackSocialReferralResponse>(
  { expose: true, method: "POST", path: "/analytics/social-referral" },
  async (req) => {
    const deviceType = getDeviceType(req.userAgent || "");
    const country = req.country || null;
    
    await analyticsDB.exec`
      INSERT INTO social_referrals (
        platform, visitor_id, visitor_ip, user_agent, device_type, country, created_at
      ) VALUES (
        ${req.platform}, 
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
