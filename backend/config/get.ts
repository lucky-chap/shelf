import { api } from "encore.dev/api";
import { configDB } from "./db";

export interface SiteConfig {
  title: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  textColor: string;
  avatarUrl: string | null;
  customDomain: string | null;
  backgroundType: string;
  backgroundImageUrl: string | null;
  selectedTheme: string | null;
}

// Retrieves the site configuration.
export const get = api<void, SiteConfig>(
  { expose: true, method: "GET", path: "/config" },
  async () => {
    const config = await configDB.queryRow<SiteConfig>`
      SELECT 
        COALESCE(site_title, 'My Landing Page') as title,
        COALESCE(site_description, 'Welcome to my creator landing page') as description,
        theme_color as "themeColor", 
        background_color as "backgroundColor", 
        text_color as "textColor", 
        owner_avatar_url as "avatarUrl",
        custom_domain as "customDomain",
        COALESCE(background_type, 'solid') as "backgroundType",
        background_image_url as "backgroundImageUrl",
        selected_theme as "selectedTheme"
      FROM site_config 
      WHERE id = 1
    `;

    if (!config) {
      // Return default config if none exists
      return {
        title: "My Landing Page",
        description: "Welcome to my creator landing page",
        themeColor: "#3B82F6",
        backgroundColor: "#FFFFFF",
        textColor: "#000000",
        avatarUrl: null,
        customDomain: null,
        backgroundType: "solid",
        backgroundImageUrl: null,
        selectedTheme: null
      };
    }

    return config;
  }
);
