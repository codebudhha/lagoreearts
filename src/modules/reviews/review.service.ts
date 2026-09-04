/**
 * Module 25: Reviews & Ratings — Business Logic & Orchestration Service
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { prisma } from '../../database/prisma.ts';
import { AuditService } from '../../audit/audit.service.ts';
import { ProductReviewRepository } from './review.repository.ts';
import { ReviewPolicy } from './review.policy.ts';
import { ReviewSerializer } from './review.serializer.ts';
import type {
  CreateReviewDto,
  UpdateReviewDto,
  AdminModerateReviewDto,
  AdminUpdateReviewDto,
  PublicReviewFilterQuery,
  AdminReviewFilterQuery,
  PublicReviewsResponse,
  CustomerReviewView,
  AdminReviewView,
  PublicReviewSummary
} from './review.types.ts';

export class ReviewService {
  /**
   * Customer: Create a verified purchase product review
   */
  static async createCustomerReview(
    customerId: string,
    productId: string,
    dto: CreateReviewDto,
    meta: any = {}
  ): Promise<CustomerReviewView> {
    // 1. Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: `Artwork with ID '${productId}' not found`
      };
    }

    // 2. Authoritative server-side purchase verification
    const { orderItem } = await ReviewPolicy.findQualifyingPurchase(customerId, productId, dto.variantId);

    // 3. Enforce One-Review Policy
    const existing = await ProductReviewRepository.findByCustomerAndProduct(customerId, productId);
    if (existing) {
      if (existing.status === 'PENDING' || existing.status === 'APPROVED') {
        throw {
          statusCode: 409,
          status: 409,
          code: 'REVIEW_ALREADY_EXISTS',
          message: 'You have already submitted a review for this artwork'
        };
      }

      // If existing review was REJECTED or HIDDEN, allow replacement / resubmission
      const updated = await ProductReviewRepository.update(existing.id, {
        rating: dto.rating,
        title: dto.title !== undefined ? dto.title : existing.title,
        body: dto.body,
        status: 'PENDING',
        publishedAt: null,
        orderItemId: orderItem.id,
        variantId: orderItem.variantId || null,
        purchasedSku: orderItem.sku,
        purchasedVariantName: orderItem.variantDescription || null,
        verifiedPurchase: true,
        verifiedPurchaseAt: new Date()
      });

      return ReviewSerializer.serializeCustomerReview(updated);
    }

    // 4. Create Review in PENDING status
    const review = await ProductReviewRepository.create({
      productId,
      customerId,
      orderItemId: orderItem.id,
      variantId: orderItem.variantId || null,
      rating: dto.rating,
      title: dto.title || null,
      body: dto.body,
      status: 'PENDING',
      verifiedPurchase: true,
      verifiedPurchaseAt: new Date(),
      purchasedSku: orderItem.sku,
      purchasedVariantName: orderItem.variantDescription || null
    });

    return ReviewSerializer.serializeCustomerReview(review);
  }

  /**
   * Customer: Get own review for a specific product
   */
  static async getCustomerReviewForProduct(customerId: string, productId: string): Promise<CustomerReviewView> {
    const review = await ProductReviewRepository.findByCustomerAndProduct(customerId, productId);
    if (!review) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'REVIEW_NOT_FOUND',
        message: 'No review found for this artwork'
      };
    }
    return ReviewSerializer.serializeCustomerReview(review);
  }

  /**
   * Customer: Update own review
   */
  static async updateCustomerReview(
    customerId: string,
    reviewId: string,
    dto: UpdateReviewDto,
    meta: any = {}
  ): Promise<CustomerReviewView> {
    const existing = await ProductReviewRepository.findById(reviewId);
    if (!existing) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'REVIEW_NOT_FOUND',
        message: `Review with ID '${reviewId}' not found`
      };
    }

    // Enforce IDOR protection
    ReviewPolicy.validateOwnership(existing, customerId);

    const updates: any = {};
    let isSubstantiveChange = false;

    if (dto.rating !== undefined && dto.rating !== existing.rating) {
      updates.rating = dto.rating;
      isSubstantiveChange = true;
    }
    if (dto.title !== undefined && dto.title !== existing.title) {
      updates.title = dto.title;
      isSubstantiveChange = true;
    }
    if (dto.body !== undefined && dto.body !== existing.body) {
      updates.body = dto.body;
      isSubstantiveChange = true;
    }

    // Re-moderation requirement: substantive changes reset status to PENDING
    if (isSubstantiveChange) {
      updates.status = 'PENDING';
      updates.publishedAt = null;
    }

    const updated = await ProductReviewRepository.update(reviewId, updates);
    return ReviewSerializer.serializeCustomerReview(updated);
  }

  /**
   * Customer: Delete own review
   */
  static async deleteCustomerReview(customerId: string, reviewId: string, meta: any = {}): Promise<void> {
    const existing = await ProductReviewRepository.findById(reviewId);
    if (!existing) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'REVIEW_NOT_FOUND',
        message: `Review with ID '${reviewId}' not found`
      };
    }

    // Enforce IDOR ownership
    ReviewPolicy.validateOwnership(existing, customerId);

    await ProductReviewRepository.delete(reviewId);
  }

  /**
   * Admin: List reviews with search and filters
   */
  static async listAdminReviews(query: AdminReviewFilterQuery) {
    const { items, total } = await ProductReviewRepository.listAdminReviews(query);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    return {
      items: items.map(r => ReviewSerializer.serializeAdminReview(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Admin: Get review by ID
   */
  static async getAdminReviewById(id: string): Promise<AdminReviewView> {
    const review = await ProductReviewRepository.findById(id);
    if (!review) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'REVIEW_NOT_FOUND',
        message: `Review with ID '${id}' not found`
      };
    }
    return ReviewSerializer.serializeAdminReview(review);
  }

  /**
   * Admin: Moderate review status (APPROVED, REJECTED, HIDDEN, PENDING)
   */
  static async moderateReview(
    id: string,
    dto: AdminModerateReviewDto,
    actorAdminId: string,
    meta: any = {}
  ): Promise<AdminReviewView> {
    const existing = await ProductReviewRepository.findById(id);
    if (!existing) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'REVIEW_NOT_FOUND',
        message: `Review with ID '${id}' not found`
      };
    }

    // State machine validation
    ReviewPolicy.validateStatusTransition(existing.status, dto.status);

    const updates: any = {
      status: dto.status
    };

    if (dto.status === 'APPROVED') {
      updates.publishedAt = existing.publishedAt || new Date();
    }

    const updated = await ProductReviewRepository.update(id, updates);

    // Audit logging
    const action =
      dto.status === 'APPROVED'
        ? 'REVIEW_APPROVED'
        : dto.status === 'REJECTED'
        ? 'REVIEW_REJECTED'
        : dto.status === 'HIDDEN'
        ? 'REVIEW_HIDDEN'
        : 'REVIEW_STATUS_CHANGED';

    AuditService.log({
      adminUserId: actorAdminId,
      action,
      module: 'REVIEWS',
      entityType: 'ProductReview',
      entityId: id,
      oldValues: { status: existing.status, publishedAt: existing.publishedAt },
      newValues: { status: updated.status, publishedAt: updated.publishedAt },
      ipAddress: meta.ip,
      userAgent: meta.userAgent
    });

    return ReviewSerializer.serializeAdminReview(updated);
  }

  /**
   * Admin: Update review details
   */
  static async updateAdminReview(
    id: string,
    dto: AdminUpdateReviewDto,
    actorAdminId: string,
    meta: any = {}
  ): Promise<AdminReviewView> {
    const existing = await ProductReviewRepository.findById(id);
    if (!existing) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'REVIEW_NOT_FOUND',
        message: `Review with ID '${id}' not found`
      };
    }

    if (dto.status && dto.status !== existing.status) {
      ReviewPolicy.validateStatusTransition(existing.status, dto.status);
    }

    const updates: any = { ...dto };
    if (dto.status === 'APPROVED' && !existing.publishedAt) {
      updates.publishedAt = new Date();
    }

    const updated = await ProductReviewRepository.update(id, updates);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'REVIEW_UPDATED',
      module: 'REVIEWS',
      entityType: 'ProductReview',
      entityId: id,
      oldValues: {
        status: existing.status,
        rating: existing.rating,
        title: existing.title,
        body: existing.body
      },
      newValues: {
        status: updated.status,
        rating: updated.rating,
        title: updated.title,
        body: updated.body
      },
      ipAddress: meta.ip,
      userAgent: meta.userAgent
    });

    return ReviewSerializer.serializeAdminReview(updated);
  }

  /**
   * Admin: Delete review
   */
  static async deleteAdminReview(id: string, actorAdminId: string, meta: any = {}): Promise<void> {
    const existing = await ProductReviewRepository.findById(id);
    if (!existing) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'REVIEW_NOT_FOUND',
        message: `Review with ID '${id}' not found`
      };
    }

    await ProductReviewRepository.delete(id);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'REVIEW_DELETED',
      module: 'REVIEWS',
      entityType: 'ProductReview',
      entityId: id,
      oldValues: {
        productId: existing.productId,
        customerId: existing.customerId,
        rating: existing.rating,
        status: existing.status
      },
      ipAddress: meta.ip,
      userAgent: meta.userAgent
    });
  }

  /**
   * Public: Get approved & published reviews for active product
   */
  static async getPublicReviews(
    slugOrId: string,
    query: PublicReviewFilterQuery = {}
  ): Promise<PublicReviewsResponse> {
    // 1. Resolve active product
    let product = await prisma.product.findUnique({ where: { slug: slugOrId } });
    if (!product) {
      product = await prisma.product.findUnique({ where: { id: slugOrId } });
    }

    if (!product || product.status !== 'ACTIVE') {
      throw {
        statusCode: 404,
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Artwork not found or is not currently active'
      };
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

    // 2. Fetch aggregate summary
    const summary = await ProductReviewRepository.getAggregateSummary(product.id);

    // 3. Fetch paginated public reviews
    const { items, total } = await ProductReviewRepository.listPublicReviews(product.id, query);

    return {
      summary,
      items: items.map(r => ReviewSerializer.serializePublicReview(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Helper: Get review summary for product detail embedding
   */
  static async getReviewSummary(productId: string): Promise<PublicReviewSummary> {
    return ProductReviewRepository.getAggregateSummary(productId);
  }
}
