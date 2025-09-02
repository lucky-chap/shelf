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
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAllLinksResponse {
  links: Link[];
}

// Retrieves all links regardless of scheduling (admin only).
export const listAll = api<void, ListAllLinksResponse>(
  { expose: true, method: "GET", path: "/links/admin" },
  async () => {
    const links = await linksDB.queryAll<Link>`
      SELECT 
        id, 
        title, 
        url, 
        description, 
        icon_url as "iconUrl", 
        background_color as "backgroundColor", 
        text_color as "textColor", 
        sort_order as "sortOrder", 
        is_active as "isActive", 
        click_count as "clickCount",
        start_date as "startDate",
        end_date as "endDate",
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM links 
      WHERE is_active = true
      ORDER BY sort_order ASC
    `;

    return { links };
  }
);
