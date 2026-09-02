export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type ProductType = 'SIMPLE' | 'VARIABLE';

export interface ProductAttributeInput {
  attributeId: string;
  attributeValueId?: string;
  textValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  sku: string;
  shortDescription?: string;
  description?: string;
  status?: ProductStatus;
  productType?: ProductType;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  currency?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  sortOrder?: number;
  categoryId: string;
  collectionIds?: string[];
  attributes?: ProductAttributeInput[];
  image?: string;
  thumbnail?: string;
  bannerImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  sku?: string;
  shortDescription?: string;
  description?: string;
  status?: ProductStatus;
  productType?: ProductType;
  price?: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  currency?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  sortOrder?: number;
  categoryId?: string;
  collectionIds?: string[];
  attributes?: ProductAttributeInput[];
  image?: string;
  thumbnail?: string;
  bannerImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface ProductFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  productType?: ProductType;
  categoryId?: string;
  collectionId?: string;
  category?: string; // slug or ID for public storefront
  collection?: string; // slug or ID for public storefront
  featured?: boolean | string;
  newArrival?: boolean | string;
  bestseller?: boolean | string;
  minPrice?: number;
  maxPrice?: number;
  stockState?: 'in_stock' | 'low_stock' | 'out_of_stock';
  sort?: 'name' | 'price' | 'sortOrder' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
  [key: string]: any; // dynamic facet filters
}

export interface AssignCollectionsInput {
  collectionIds: string[];
}

export interface AssignAttributesInput {
  attributes: ProductAttributeInput[];
}
