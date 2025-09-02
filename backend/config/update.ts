import { api } from "encore.dev/api";
import { configDB } from "./db";

export interface UpdateSiteConfigRequest {
  title: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  textColor: string;
  avatarUrl?: string;
  customDomain?: string;
}

export interface SiteConfig {
  title: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  textColor: string;
  avatarUrl: string | null;
  customDomain: string | null;
}

// Updates the site configuration.
export const update = api<UpdateSiteConfigRequest, SiteConfig>(
  { expose: true, method: "PUT", path: "/config" },
  async (req) => {
    const config = await configDB.queryRow<SiteConfig>`
      INSERT INTO site_config (id, site_title, site_description, theme_color, background_color, text_color, owner_avatar_url, custom_domain)
      VALUES (1, ${req.title}, ${req.description}, ${req.themeColor}, ${req.backgroundColor}, ${req.textColor}, ${req.avatarUrl || null}, ${req.customDomain || null})
      ON CONFLICT (id) DO UPDATE SET
        site_title = EXCLUDED.site_title,
        site_description = EXCLUDED.site_description,
        theme_color = EXCLUDED.theme_color,
        background_color = EXCLUDED.background_color,
        text_color = EXCLUDED.text_color,
        owner_avatar_url = EXCLUDED.owner_avatar_url,
        custom_domain = EXCLUDED.custom_domain,
        updated_at = NOW()
      RETURNING 
        site_title as title,
        site_description as description,
        theme_color as "themeColor", 
        background_color as "backgroundColor", 
        text_color as "textColor", 
        owner_avatar_url as "avatarUrl",
        custom_domain as "customDomain"
    `;

    if (!config) {
      throw new Error("Failed to update site configuration");
    }

    return config;
  }
);
