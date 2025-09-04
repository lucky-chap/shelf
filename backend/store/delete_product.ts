import { api, APIError } from "encore.dev/api";
import { storeDB } from "./db";
import { productFiles, productAssets } from "./storage";

export interface DeleteProductParams {
  id: number;
}

// Deletes a product and its associated files.
export const deleteProduct = api<DeleteProductParams, void>(
  { expose: true, method: "DELETE", path: "/store/products/:id" },
  async ({ id }) => {
    // Get product details before deletion to clean up files
    const product = await storeDB.queryRow<{ 
      fileUrl: string; 
      coverImageUrl: string | null; 
    }>`
      SELECT file_url as "fileUrl", cover_image_url as "coverImageUrl"
      FROM products 
      WHERE id = ${id}
    `;

    if (!product) {
      throw APIError.notFound("product not found");
    }

    // Delete the product from database
    const result = await storeDB.queryRow<{ id: number }>`
      DELETE FROM products 
      WHERE id = ${id}
      RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("product not found");
    }

    // Clean up files from storage (best effort - don't fail if files don't exist)
    try {
      // Extract filename from URL and remove from product files bucket
      if (product.fileUrl) {
        const fileName = product.fileUrl.split('/').pop();
        if (fileName) {
          await productFiles.remove(fileName);
        }
      }

      // Remove cover image if exists
      if (product.coverImageUrl) {
        const coverFileName = product.coverImageUrl.split('/').pop();
        if (coverFileName) {
          await productAssets.remove(coverFileName);
        }
      }
    } catch (error) {
      console.error("Failed to clean up product files:", error);
      // Don't fail the API call if file cleanup fails
    }
  }
);
