import { api } from "encore.dev/api";
import { linksDB } from "./db";

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

export interface ListLinksResponse {
  links: Link[];
}

// Retrieves all active links, ordered by sort order.
export const list = api<void, ListLinksResponse>(
  { expose: true, method: "GET", path: "/links" },
  async () => {
    const links = await linksDB.queryAll<Link>`
      SELECT id, title, url, description, icon_url as "iconUrl", background_color as "backgroundColor", text_color as "textColor", sort_order as "sortOrder", is_active as "isActive", click_count as "clickCount", created_at as "createdAt", updated_at as "updatedAt"
      FROM links 
      WHERE is_active = true
      ORDER BY sort_order ASC
    `;

    return { links };
  }
);
