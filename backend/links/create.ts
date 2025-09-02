import { api, APIError } from "encore.dev/api";
import { linksDB } from "./db";

export interface CreateLinkRequest {
  title: string;
  url: string;
  description?: string;
  iconUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  startDate?: Date;
  endDate?: Date;
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
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new link with optional scheduling.
export const create = api<CreateLinkRequest, Link>(
  { expose: true, method: "POST", path: "/links" },
  async (req) => {
    // Validate date range if both dates are provided
    if (req.startDate && req.endDate && req.startDate >= req.endDate) {
      throw APIError.invalidArgument("start date must be before end date");
    }

    // Get the next sort order
    const maxSortOrder = await linksDB.queryRow<{ max: number | null }>`
      SELECT MAX(sort_order) as max FROM links
    `;
    
    const nextSortOrder = (maxSortOrder?.max || 0) + 1;

    const link = await linksDB.queryRow<Link>`
      INSERT INTO links (
        title, 
        url, 
        description, 
        icon_url, 
        background_color, 
        text_color, 
        sort_order,
        start_date,
        end_date
      )
      VALUES (
        ${req.title}, 
        ${req.url}, 
        ${req.description || null}, 
        ${req.iconUrl || null}, 
        ${req.backgroundColor || '#FFFFFF'}, 
        ${req.textColor || '#000000'}, 
        ${nextSortOrder},
        ${req.startDate || null},
        ${req.endDate || null}
      )
      RETURNING 
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
    `;

    if (!link) {
      throw APIError.internal("failed to create link");
    }

    return link;
  }
);
