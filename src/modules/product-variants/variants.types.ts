export type ProductVariantStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface CreateProductOptionDto {
  name: string;
  slug?: string;
  sortOrder?: number;
}

export interface UpdateProductOptionDto {
  name?: string;
  slug?: string;
  sortOrder?: number;
}

export interface CreateProductOptionValueDto {
  value: string;
  slug?: string;
  sortOrder?: number;
}

export interface UpdateProductOptionValueDto {
  value?: string;
  slug?: string;
  sortOrder?: number;
}

export interface VariantOptionValueInput {
  optionId?: string;
  optionValueId: string;
}

export interface CreateProductVariantDto {
  sku: string;
  price?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  status?: ProductVariantStatus;
  image?: string | null;
  sortOrder?: number;
  optionValues: VariantOptionValueInput[];
}

export interface UpdateProductVariantDto {
  sku?: string;
  price?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  status?: ProductVariantStatus;
  image?: string | null;
  sortOrder?: number;
  optionValues?: VariantOptionValueInput[];
}

export interface VariantQueryFilters {
  page?: number;
  limit?: number;
  status?: ProductVariantStatus;
  sku?: string;
  sortBy?: 'sortOrder' | 'sku' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  stockState?: 'in_stock' | 'out_of_stock' | 'low_stock';
}
