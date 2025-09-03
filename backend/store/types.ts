export interface Product {
  id: number;
  title: string;
  description: string | null;
  priceCents: number; // 0 for free
  coverUrl: string | null; // public URL to cover image
  coverKey: string | null;  // object name in cover bucket
  fileKey: string; // object name in files bucket
  downloadUrl: string; // secure pre-signed URL (may expire), stored at creation or update
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  title: string;
  description?: string;
  priceCents?: number; // default 0
  coverObjectName?: string; // object name returned by generateUploadUrl for cover
  fileObjectName: string; // object name returned by generateUploadUrl for file
}

export interface UpdateProductRequest {
  id: number;
  title?: string;
  description?: string;
  priceCents?: number;
  coverObjectName?: string | null;
  fileObjectName?: string;
  isActive?: boolean;
}

export interface ListProductsResponse {
  products: Array<{
    id: number;
    title: string;
    description: string | null;
    priceCents: number;
    coverUrl: string | null;
    isActive: boolean;
    createdAt: Date;
  }>;
}

export interface DeleteProductParams {
  id: number;
}
