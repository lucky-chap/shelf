export interface Product {
  id: number;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  fileObjectName: string;
  coverObjectName: string | null;
  coverUrl: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicProduct {
  id: number;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  coverUrl: string | null;
}
