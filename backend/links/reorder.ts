import { api } from "encore.dev/api";
import { linksDB } from "./db";

export interface ReorderLinksRequest {
  linkIds: number[];
}

export interface Link {
  id: number;
  title: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  backgroundColor: string;
  textColor: string;
  sortOrder: number;
  isActive: boolean;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReorderLinksResponse {
  links: Link[];
}

// Reorders links based on the provided array of link IDs.
export const reorder = api<ReorderLinksRequest, ReorderLinksResponse>(
  { expose: true, method: "PUT", path: "/links/reorder" },
  async ({ linkIds }) => {
    // Update sort order for each link
    for (let i = 0; i < linkIds.length; i++) {
      await linksDB.exec`
        UPDATE links 
        SET sort_order = ${i + 1}, updated_at = NOW()
        WHERE id = ${linkIds[i]}
      `;
    }

    // Return updated links
    const links = await linksDB.queryAll<Link>`
      SELECT id, title, url, description, icon_url as "iconUrl", background_color as "backgroundColor", text_color as "textColor", sort_order as "sortOrder", is_active as "isActive", click_count as "clickCount", created_at as "createdAt", updated_at as "updatedAt"
      FROM links 
      WHERE is_active = true
      ORDER BY sort_order ASC
    `;

    return { links };
  }
);
