import { api, APIError } from "encore.dev/api";
import { linksDB } from "./db";

export interface ClickLinkParams {
  id: number;
}

export interface ClickLinkResponse {
  url: string;
}

// Records a click on a link and returns the URL to redirect to.
export const click = api<ClickLinkParams, ClickLinkResponse>(
  { expose: true, method: "POST", path: "/links/:id/click" },
  async ({ id }) => {
    const link = await linksDB.queryRow<{ url: string }>`
      UPDATE links 
      SET click_count = click_count + 1, updated_at = NOW()
      WHERE id = ${id} AND is_active = true
      RETURNING url
    `;

    if (!link) {
      throw APIError.notFound("link not found");
    }

    return { url: link.url };
  }
);
