import { api, APIError } from "encore.dev/api";
import { siteDB } from "./db";

export interface UpdateSiteConfigRequest {
  siteTitle: string;
  siteDescription: string;
  ownerName: string;
  ownerBio?: string;
  ownerAvatarUrl?: string;
  themeColor: string;
  backgroundColor: string;
  textColor: string;
}

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

// Updates the site configuration.
export const updateConfig = api<UpdateSiteConfigRequest, SiteConfig>(
  { expose: true, method: "PUT", path: "/site/config" },
  async (req) => {
    // First, try to update existing config
    const updated = await siteDB.queryRow<SiteConfig>`
      UPDATE site_config 
      SET 
        site_title = ${req.siteTitle},
        site_description = ${req.siteDescription},
        owner_name = ${req.ownerName},
        owner_bio = ${req.ownerBio || null},
        owner_avatar_url = ${req.ownerAvatarUrl || null},
        theme_color = ${req.themeColor},
        background_color = ${req.backgroundColor},
        text_color = ${req.textColor},
        updated_at = NOW()
      WHERE id = 1
      RETURNING 
        site_title as "siteTitle",
        site_description as "siteDescription", 
        owner_name as "ownerName",
        owner_bio as "ownerBio",
        owner_avatar_url as "ownerAvatarUrl",
        theme_color as "themeColor",
        background_color as "backgroundColor",
        text_color as "textColor"
    `;

    if (updated) {
      return updated;
    }

    // If no existing config, create a new one
    const created = await siteDB.queryRow<SiteConfig>`
      INSERT INTO site_config (
        id, site_title, site_description, owner_name, owner_bio, 
        owner_avatar_url, theme_color, background_color, text_color
      )
      VALUES (
        1, ${req.siteTitle}, ${req.siteDescription}, ${req.ownerName}, 
        ${req.ownerBio || null}, ${req.ownerAvatarUrl || null}, 
        ${req.themeColor}, ${req.backgroundColor}, ${req.textColor}
      )
      RETURNING 
        site_title as "siteTitle",
        site_description as "siteDescription", 
        owner_name as "ownerName",
        owner_bio as "ownerBio",
        owner_avatar_url as "ownerAvatarUrl",
        theme_color as "themeColor",
        background_color as "backgroundColor",
        text_color as "textColor"
    `;

    if (!created) {
      throw APIError.internal("failed to update site configuration");
    }

    return created;
  }
);
