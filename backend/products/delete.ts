import { api, APIError } from "encore.dev/api";
import { productsDB } from "./db";

export interface DeleteProductParams {
  id: number;
}

// Deletes a product.
export const deleteFn = api<DeleteProductParams, void>(
  { expose: true, method: "DELETE", path: "/products/:id" },
  async ({ id }) => {
    const result = await productsDB.queryRow<{ id: number }>`
      DELETE FROM products 
      WHERE id = ${id}
      RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("product not found");
    }
  }
);
