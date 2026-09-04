/**
 * Module 25: Reviews & Ratings — Database Repository
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { prisma } from '../../database/prisma.ts';
import type {
  ProductReviewEntity,
  PublicReviewFilterQuery,
  AdminReviewFilterQuery,
  PublicReviewSummary,
  RatingDistribution
} from './review.types.ts';

export class ProductReviewRepository {
  /**
   * Find single review by ID with hydrated relations
   */
  static async findById(id: string, includeRelations: boolean = true): Promise<ProductReviewEntity | null> {
    const include: any = includeRelations
      ? {
          product: true,
          customer: true,
          orderItem: true,
          variant: true
        }
      : undefined;

    return prisma.productReview.findUnique({
      where: { id },
      include
    });
  }

  /**
   * Find review by (customerId, productId)
   */
  static async findByCustomerAndProduct(customerId: string, productId: string): Promise<ProductReviewEntity | null> {
    return prisma.productReview.findFirst({
      where: {
        customerId,
        productId
      },
      include: {
        product: true,
        customer: true,
        orderItem: true,
        variant: true
      }
    });
  }

  /**
   * Create new product review
   */
  static async create(data: {
    productId: string;
    customerId: string;
    orderItemId?: string | null;
    variantId?: string | null;
    rating: number;
    title?: string | null;
    body: string;
    status?: string;
    verifiedPurchase?: boolean;
    verifiedPurchaseAt?: Date | null;
    purchasedSku?: string | null;
    purchasedVariantName?: string | null;
  }): Promise<ProductReviewEntity> {
    return prisma.productReview.create({
      data,
      include: {
        product: true,
        customer: true,
        orderItem: true,
        variant: true
      }
    });
  }

  /**
   * Update existing product review
   */
  static async update(
    id: string,
    data: {
      rating?: number;
      title?: string | null;
      body?: string;
      status?: string;
      verifiedPurchase?: boolean;
      verifiedPurchaseAt?: Date | null;
      purchasedSku?: string | null;
      purchasedVariantName?: string | null;
      helpfulCount?: number;
      reportCount?: number;
      publishedAt?: Date | null;
    }
  ): Promise<ProductReviewEntity> {
    return prisma.productReview.update({
      where: { id },
      data,
      include: {
        product: true,
        customer: true,
        orderItem: true,
        variant: true
      }
    });
  }

  /**
   * Delete product review
   */
  static async delete(id: string): Promise<ProductReviewEntity | null> {
    return prisma.productReview.delete({
      where: { id }
    });
  }

  /**
   * List public approved & published reviews for an active product
   */
  static async listPublicReviews(
    productId: string,
    query: PublicReviewFilterQuery = {}
  ): Promise<{ items: ProductReviewEntity[]; total: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      productId,
      status: 'APPROVED',
      publishedAt: { lte: new Date() }
    };

    if (query.rating !== undefined) {
      where.rating = Number(query.rating);
    }

    if (query.verifiedPurchase !== undefined) {
      where.verifiedPurchase = query.verifiedPurchase === 'true' || query.verifiedPurchase === true;
    }

    let orderBy: any = [{ createdAt: 'desc' }, { id: 'desc' }];
    if (query.sort === 'oldest') {
      orderBy = [{ createdAt: 'asc' }, { id: 'asc' }];
    } else if (query.sort === 'highest_rating') {
      orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }];
    } else if (query.sort === 'lowest_rating') {
      orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }];
    } else if (query.sort === 'helpful') {
      orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }];
    }

    const [items, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          customer: true,
          product: true,
          variant: true
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.productReview.count({ where })
    ]);

    return { items, total };
  }

  /**
   * List reviews for admin management
   */
  static async listAdminReviews(
    query: AdminReviewFilterQuery = {}
  ): Promise<{ items: ProductReviewEntity[]; total: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.productId) {
      where.productId = query.productId;
    }
    if (query.customerId) {
      where.customerId = query.customerId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.rating !== undefined) {
      where.rating = Number(query.rating);
    }
    if (query.verifiedPurchase !== undefined) {
      where.verifiedPurchase = query.verifiedPurchase === 'true' || query.verifiedPurchase === true;
    }
    if (query.search) {
      where.search = query.search;
    }

    let orderBy: any = [{ createdAt: 'desc' }];
    if (query.sort) {
      const dir = query.order?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      if (query.sort === 'rating') orderBy = [{ rating: dir }, { createdAt: 'desc' }];
      else if (query.sort === 'helpfulCount') orderBy = [{ helpfulCount: dir }, { createdAt: 'desc' }];
      else if (query.sort === 'publishedAt') orderBy = [{ publishedAt: dir }, { createdAt: 'desc' }];
      else if (query.sort === 'createdAt') orderBy = [{ createdAt: dir }];
    }

    const [items, total] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          customer: true,
          product: true,
          orderItem: true,
          variant: true
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.productReview.count({ where })
    ]);

    return { items, total };
  }

  /**
   * Compute aggregate review summary statistics for a product
   * Strictly includes only APPROVED reviews with publishedAt <= now.
   */
  static async getAggregateSummary(productId: string): Promise<PublicReviewSummary> {
    const approvedReviews = await prisma.productReview.findMany({
      where: {
        productId,
        status: 'APPROVED',
        publishedAt: { lte: new Date() }
      }
    });

    const totalReviews = approvedReviews.length;
    const ratingDistribution: RatingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution,
        verifiedReviewCount: 0
      };
    }

    let sum = 0;
    let verifiedReviewCount = 0;

    for (const rev of approvedReviews) {
      const r = rev.rating;
      if (r >= 1 && r <= 5) {
        ratingDistribution[r as keyof RatingDistribution]++;
        sum += r;
      }
      if (rev.verifiedPurchase) {
        verifiedReviewCount++;
      }
    }

    // Decimal-safe average rounded to 1 decimal place
    const rawAverage = sum / totalReviews;
    const averageRating = Math.round(rawAverage * 10) / 10;

    return {
      averageRating,
      totalReviews,
      ratingDistribution,
      verifiedReviewCount
    };
  }
}
