/**
 * Module 25: Reviews & Ratings — Type Definitions
 * Lagoree Arts Luxury E-Commerce Backend
 */

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';

export interface ProductReviewEntity {
  id: string;
  productId: string;
  customerId: string | null;
  orderItemId: string | null;
  variantId: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  verifiedPurchaseAt: Date | null;
  purchasedSku: string | null;
  purchasedVariantName: string | null;
  helpfulCount: number;
  reportCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  product?: any;
  customer?: any;
  orderItem?: any;
  variant?: any;
}

export interface CreateReviewDto {
  rating: number;
  title?: string;
  body: string;
  variantId?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  title?: string | null;
  body?: string;
}

export interface AdminModerateReviewDto {
  status: ReviewStatus;
  moderationNotes?: string;
}

export interface AdminUpdateReviewDto {
  status?: ReviewStatus;
  rating?: number;
  title?: string | null;
  body?: string;
}

export interface PublicReviewFilterQuery {
  page?: number | string;
  limit?: number | string;
  rating?: number | string;
  verifiedPurchase?: boolean | string;
  sort?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'helpful';
}

export interface AdminReviewFilterQuery {
  page?: number | string;
  limit?: number | string;
  status?: ReviewStatus;
  rating?: number | string;
  verifiedPurchase?: boolean | string;
  productId?: string;
  customerId?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface PublicReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  verifiedReviewCount: number;
}

export interface PublicReviewItemView {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  purchasedVariantName: string | null;
  reviewerDisplayName: string;
  helpfulCount: number;
  createdAt: string;
  publishedAt: string | null;
}

export interface PublicReviewsResponse {
  summary: PublicReviewSummary;
  items: PublicReviewItemView[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerReviewView {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  productThumbnail?: string | null;
  variantId: string | null;
  purchasedVariantName: string | null;
  purchasedSku: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  verifiedPurchaseAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewView {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    thumbnail: string | null;
    status: string;
  } | null;
  customerId: string | null;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  orderItemId: string | null;
  orderItem: {
    id: string;
    orderId: string;
    sku: string;
    productName: string;
    variantDescription: string | null;
    lineTotal: number;
  } | null;
  variantId: string | null;
  variant: {
    id: string;
    sku: string;
  } | null;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  verifiedPurchaseAt: string | null;
  purchasedSku: string | null;
  purchasedVariantName: string | null;
  helpfulCount: number;
  reportCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
