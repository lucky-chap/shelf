import { api } from "encore.dev/api";
import { siteDB } from "./db";

export interface SiteConfig {
  siteTitle: string;
  siteDescription: string;
  ownerName: string;
  ownerBio: string | null;
  ownerAvatarUrl: string | null;
  themeColor: string;
  backgroundColor: string;
  textColor: string;
}

// Retrieves the site configuration.
export const getConfig = api<void, SiteConfig>(
  { expose: true, method: "GET", path: "/site/config" },
  async () => {
    const config = await siteDB.queryRow<SiteConfig>`
      SELECT 
        site_title as "siteTitle",
        site_description as "siteDescription", 
        owner_name as "ownerName",
        owner_bio as "ownerBio",
        owner_avatar_url as "ownerAvatarUrl",
        theme_color as "themeColor",
        background_color as "backgroundColor",
        text_color as "textColor"
      FROM site_config 
      WHERE id = 1
    `;

    if (!config) {
      // Return default config if none exists
      return {
        siteTitle: "My Creator Landing",
        siteDescription: "Welcome to my page",
        ownerName: "Creator",
        ownerBio: null,
        ownerAvatarUrl: null,
        themeColor: "#3B82F6",
        backgroundColor: "#FFFFFF",
        textColor: "#000000"
      };
    }

    return config;
  }
);
