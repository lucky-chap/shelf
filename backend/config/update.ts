import { api } from "encore.dev/api";
import { configDB } from "./db";

export interface UpdateSiteConfigRequest {
  title: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  textColor: string;
  avatarUrl?: string;
  backgroundType?: "solid" | "unsplash" | "upload";
  backgroundImageUrl?: string;
  selectedTheme?: string;
  layoutType?: string;
  fontFamily?: string;
}

export interface SiteConfig {
  title: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  textColor: string;
  avatarUrl: string | null;
  backgroundType: string;
  backgroundImageUrl: string | null;
  selectedTheme: string | null;
  layoutType: string | null;
  fontFamily: string | null;
}

// Updates the site configuration.
export const update = api<UpdateSiteConfigRequest, SiteConfig>(
  { expose: true, method: "PUT", path: "/config" },
  async (req) => {
    const config = await configDB.queryRow<SiteConfig>`
      INSERT INTO site_config (
        id, site_title, site_description, theme_color, background_color, text_color, 
        owner_avatar_url, background_type, background_image_url, selected_theme, layout_type, font_family
      )
      VALUES (
        1, ${req.title}, ${req.description}, ${req.themeColor}, ${req.backgroundColor}, ${req.textColor}, 
        ${req.avatarUrl || null}, ${req.backgroundType || "solid"}, 
        ${req.backgroundImageUrl || null}, ${req.selectedTheme || null}, ${req.layoutType || null}, ${req.fontFamily || 'sans-serif'}
      )
      ON CONFLICT (id) DO UPDATE SET
        site_title = EXCLUDED.site_title,
        site_description = EXCLUDED.site_description,
        theme_color = EXCLUDED.theme_color,
        background_color = EXCLUDED.background_color,
        text_color = EXCLUDED.text_color,
        owner_avatar_url = EXCLUDED.owner_avatar_url,
        background_type = EXCLUDED.background_type,
        background_image_url = EXCLUDED.background_image_url,
        selected_theme = EXCLUDED.selected_theme,
        layout_type = EXCLUDED.layout_type,
        font_family = EXCLUDED.font_family,
        updated_at = NOW()
      RETURNING 
        site_title as title,
        site_description as description,
        theme_color as "themeColor", 
        background_color as "backgroundColor", 
        text_color as "textColor", 
        owner_avatar_url as "avatarUrl",
        background_type as "backgroundType",
        background_image_url as "backgroundImageUrl",
        selected_theme as "selectedTheme",
        layout_type as "layoutType",
        font_family as "fontFamily"
    `;

    if (!config) {
      throw new Error("Failed to update site configuration");
    }

    return config;
  }
);
