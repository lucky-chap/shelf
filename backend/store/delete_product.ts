import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import type { DeleteProductParams } from "./types";

// Deletes a product.
export const deleteProduct = api<DeleteProductParams, void>(
  { expose: true, method: "DELETE", path: "/store/products/:id" },
  async ({ id }) => {
    const row = await storeDB.queryRow<{ id: number }>`
      DELETE FROM products WHERE id = ${id} RETURNING id
    `;
    if (!row) throw APIError.notFound("product not found");
  }
);
