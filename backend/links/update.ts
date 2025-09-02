import { api, APIError } from "encore.dev/api";
import { linksDB } from "./db";

export interface UpdateLinkRequest {
  id: number;
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

// Updates an existing link with optional scheduling.
export const update = api<UpdateLinkRequest, Link>(
  { expose: true, method: "PUT", path: "/links/:id" },
  async (req) => {
    // Validate date range if both dates are provided
    if (req.startDate && req.endDate && req.startDate >= req.endDate) {
      throw APIError.invalidArgument("start date must be before end date");
    }

    const link = await linksDB.queryRow<Link>`
      UPDATE links 
      SET 
        title = ${req.title}, 
        url = ${req.url}, 
        description = ${req.description || null}, 
        icon_url = ${req.iconUrl || null}, 
        background_color = ${req.backgroundColor || '#FFFFFF'}, 
        text_color = ${req.textColor || '#000000'},
        start_date = ${req.startDate || null},
        end_date = ${req.endDate || null},
        updated_at = NOW()
      WHERE id = ${req.id}
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
      throw APIError.notFound("link not found");
    }

    return link;
  }
);
