/**
 * Module 24: Cross-sell & Upsell — Domain Types & DTOs
 * Lagoree Arts Luxury E-Commerce Backend
 */

export type RecommendationType = 'CROSS_SELL' | 'UPSELL' | 'RELATED';

export type RecommendationSource =
  | 'EXPLICIT'
  | 'COLLECTION'
  | 'CATEGORY'
  | 'ATTRIBUTE'
  | 'ARTIST'
  | 'SANSKRIT_EDIT'
  | 'ANTIQUE';

export interface ProductRecommendationRecord {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  type: RecommendationType;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  sourceProduct?: any;
  targetProduct?: any;
}

export interface CreateRecommendationDto {
  targetProductId: string;
  type: RecommendationType;
  sortOrder?: number;
  isActive?: boolean;
}

export interface AdminCreateRecommendationBody extends CreateRecommendationDto {
  sourceProductId?: string; // Optional if derived from route parameter
}

export interface UpdateRecommendationDto {
  type?: RecommendationType;
  sortOrder?: number;
  isActive?: boolean;
  targetProductId?: string;
}

export interface ReorderItemDto {
  id: string;
  sortOrder: number;
}

export interface RecommendationFilterQuery {
  sourceProductId?: string;
  targetProductId?: string;
  type?: RecommendationType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'sortOrder' | 'createdAt' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface PublicRecommendationQuery {
  type?: RecommendationType;
  limit?: number;
}

export interface PublicRecommendedProductView {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string | null;
  productType: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  availability: {
    inStock: boolean;
    allowBackorder: boolean;
  };
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  image?: string | null;
  thumbnail?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface PublicRecommendationsGrouped {
  crossSell: PublicRecommendedProductView[];
  upsell: PublicRecommendedProductView[];
  related: PublicRecommendedProductView[];
}

export interface PublicRecommendationResponse {
  product: {
    id: string;
    name: string;
    slug: string;
  };
  recommendations: PublicRecommendationsGrouped;
}

export interface AdminRecommendationView {
  id: string;
  sourceProductId: string;
  sourceProduct?: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    status: string;
  } | null;
  targetProductId: string;
  targetProduct?: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    status: string;
    price: number;
  } | null;
  type: RecommendationType;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminRecommendationPreviewItem {
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    status: string;
    price: number;
    thumbnail?: string | null;
  };
  source: RecommendationSource;
  score: number;
  rankingReason: string;
  recommendationId?: string | null;
  sortOrder?: number;
}

export interface AdminRecommendationPreviewGrouped {
  productId: string;
  productName: string;
  crossSell: AdminRecommendationPreviewItem[];
  upsell: AdminRecommendationPreviewItem[];
  related: AdminRecommendationPreviewItem[];
}
