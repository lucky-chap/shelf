import { api, APIError } from "encore.dev/api";
import { linksDB } from "./db";

export interface DeleteLinkParams {
  id: number;
}

// Deletes a link.
export const deleteFn = api<DeleteLinkParams, void>(
  { expose: true, method: "DELETE", path: "/links/:id" },
  async ({ id }) => {
    const result = await linksDB.queryRow<{ id: number }>`
      DELETE FROM links 
      WHERE id = ${id}
      RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("link not found");
    }
  }
);
